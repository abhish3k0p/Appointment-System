import express from "express";
import { z } from "zod";
import { authRequired, requireRole } from "../middleware/auth.js";
import Appointment from "../models/Appointment.js";
import DoctorProfile from "../models/DoctorProfile.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/email.js";
import { sendSMS } from "../utils/sms.js";

const appointmentRoutes = express.Router();

/**
 * ✅ Get doctor availability (slots)
 */
appointmentRoutes.get("/doctor/:doctorId/availability", async (req, res, next) => {
  try {
    const schema = z.object({ date: z.string() }); // YYYY-MM-DD
    const { date } = schema.parse(req.query);
    const doctorId = req.params.doctorId;

    // Find doctor profile
    const profile = await DoctorProfile.findOne({ userId: doctorId });
    if (!profile) return res.status(404).json({ message: "Doctor profile not found" });

    // Doctor marked unavailable
    if (profile.unavailableDates?.includes(date)) return res.json({ slots: [] });

    // Map weekday to schema key
    const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const jsDay = new Date(date).getDay(); // 0=Sun
    const dayKey = dayMap[jsDay];

    const windows = profile.workingHours?.[dayKey] || [];
    if (!windows.length) return res.json({ slots: [] });

    const slotDuration = profile.slotDurationMins || 30;
    const slots = [];

    for (const w of windows) {
      let current = new Date(`${date}T${w.start}:00`);
      const end = new Date(`${date}T${w.end}:00`);

      while (current < end) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + slotDuration * 60000);

        if (slotEnd <= end) {
          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
          });
        }
        current = slotEnd;
      }
    }

    // Find booked appointments for that doctor on this date
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const appointments = await Appointment.find({
      doctorId,
      status: { $in: ["booked", "pending"] },
      start: { $gte: dayStart, $lte: dayEnd },
    });

    const booked = appointments.map((a) => ({
      startTime: a.start.toISOString(),
      endTime: a.end.toISOString(),
    }));

    const freeSlots = slots.filter(
      (slot) => !booked.some((b) => b.startTime === slot.startTime && b.endTime === slot.endTime)
    );

    res.json({ slots: freeSlots });
  } catch (err) {
    next(err);
  }
});

/**
 * Patient books an appointment
 */
appointmentRoutes.post("/book", authRequired, requireRole("patient"), async (req, res, next) => {
  try {
    const schema = z.object({
      profileId: z.string(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      reason: z.string().optional(),
    });

    const { profileId, startTime, endTime, reason } = schema.parse(req.body);
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) return res.status(400).json({ message: "End time must be after start time" });

    const profile = await DoctorProfile.findById(profileId);
    if (!profile) return res.status(404).json({ message: "Doctor profile not found" });

    const doctorId = profile.userId;

    const dayStr = start.toISOString().split("T")[0];
    if (profile.unavailableDates?.includes(dayStr)) {
      return res.status(400).json({ message: "Doctor not available on this date" });
    }

    // Check for conflict
    const conflict = await Appointment.findOne({
      doctorId,
      status: { $in: ["booked", "pending"] },
      start: { $lt: end },
      end: { $gt: start },
    });
    if (conflict) return res.status(400).json({ message: "This slot is already booked" });

    // Create appointment
    const appointment = await Appointment.create({
      doctorId,
      patientId: req.user.id,
      hospitalId: profile.hospitalId,
      start: start,
      end: end,
      status: "pending",
      reason: reason || "",
      payment: { status: "unpaid" },
    });

    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
});

/**
 * Patient cancels appointment
 */
appointmentRoutes.post("/:id/cancel", authRequired, requireRole("patient"), async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (appointment.status === "cancelled") {
      return res.json({ message: "Appointment already cancelled", appointment });
    }

    if (["completed", "no_show"].includes(appointment.status)) {
      return res.status(400).json({ message: `Cannot cancel an appointment with status '${appointment.status}'` });
    }

    appointment.status = "cancelled";
    await appointment.save();

    const patient = await User.findById(appointment.patientId);
    const doctor = await User.findById(appointment.doctorId);
    const appointmentDateTime = appointment.start.toLocaleString();

    await sendEmail(
      patient.email,
      "Appointment Cancelled",
      `Your appointment with Dr. ${doctor.name} on ${appointmentDateTime} has been cancelled.`
    );
    await sendSMS(patient.phone, `Your appointment with Dr. ${doctor.name} on ${appointmentDateTime} has been cancelled.`);

    await sendEmail(
      doctor.email,
      "Appointment Cancelled",
      `The appointment with patient ${patient.name} on ${appointmentDateTime} has been cancelled.`
    );
    await sendSMS(doctor.phone, `Appointment with ${patient.name} on ${appointmentDateTime} has been cancelled.`);

    res.json({ message: "Appointment cancelled", appointment });
  } catch (err) {
    next(err);
  }
});

/**
 * Patient views their appointments
 */
appointmentRoutes.get("/my", authRequired, requireRole("patient"), async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id })
      .populate("doctorId", "name email")
      .sort({ start: 1 });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

/**
 * Doctor marks appointment completed
 */
appointmentRoutes.post("/:id/complete", authRequired, requireRole("doctor"), async (req, res, next) => {
  try {
    const schema = z.object({ notes: z.string().optional(), prescription: z.string().optional() });
    const { notes, prescription } = schema.parse(req.body);

    const appointment = await Appointment.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (appointment.status === "completed") {
      return res.status(400).json({ message: "Appointment already completed" });
    }

    appointment.status = "completed";
    if (notes) appointment.notes = notes;
    if (prescription) appointment.prescription = prescription;
    await appointment.save();

    const patient = await User.findById(appointment.patientId);
    const doctor = await User.findById(req.user.id);
    const appointmentDateTime = appointment.start.toLocaleString();

    const emailMessage = `Your appointment with Dr. ${doctor.name} on ${appointmentDateTime} has been marked as completed.\nNotes: ${notes || "None"}\nPrescription: ${prescription || "None"}`;

    await sendEmail(patient.email, "Appointment Completed - Prescription & Notes", emailMessage);
    await sendSMS(
      patient.phone,
      `Your appointment with Dr. ${doctor.name} on ${appointmentDateTime} is completed. Notes & prescription sent to your email.`
    );

    res.json({ message: "Appointment marked as completed", appointment });
  } catch (err) {
    next(err);
  }
});

/**
 * Admin views all appointments
 */
appointmentRoutes.get("/all", authRequired, requireRole("admin"), async (req, res, next) => {
  try {
    const appointments = await Appointment.find()
      .populate("doctorId", "name email")
      .populate("patientId", "name email")
      .sort({ start: -1 });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

export default appointmentRoutes;
