import express from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import Appointment from '../models/Appointment.js';
import Note from '../models/Note.js';
import User from '../models/User.js';
import Availability from '../models/Availability.js';
import { z } from 'zod';
import DoctorProfile from "../models/DoctorProfile.js";
import Hospital from "../models/Hospital.js";
import { upload } from "../middleware/upload.js";

const patientRoutes = express.Router();

patientRoutes.get('/hospitals', authRequired, requireRole('patient'), async (req, res, next) => {
  try {
    const hospitals = await Hospital.find().populate('departments', 'name');
    res.json(hospitals);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

patientRoutes.patch("/profile", authRequired, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json(user);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

import fs from 'fs';
import path from 'path';

patientRoutes.post("/profile/avatar", authRequired, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Find current user to get old avatar path
    const user = await User.findById(req.user.id);
    if (user && user.avatarUrl) {
      // Extract filename from avatarUrl
      const oldFilename = user.avatarUrl.split('/uploads/')[1];
      if (oldFilename) {
        const oldFilePath = path.join(process.cwd(), 'uploads', oldFilename);
        // Delete old avatar file if exists
        fs.unlink(oldFilePath, (err) => {
          if (err) {
            console.warn("Failed to delete old avatar file:", err);
          }
        });
      }
    }

    // Build relative URL for the uploaded avatar
    const avatarUrl = `/uploads/${req.file.filename}`;

    // Save new avatarUrl in DB
    await User.findByIdAndUpdate(req.user.id, { avatarUrl });

    res.json({ avatarUrl });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
});

/**
 * -----------------------
 * APPOINTMENTS
 * -----------------------
 */
patientRoutes.get('/upcoming', authRequired, requireRole('patient'), async (req, res, next) => {
  try {
    const now = new Date();
    const appointments = await Appointment.find({
      patientId: req.user.id,
      startTime: { $gte: now },
      status: { $in: ['booked', 'confirmed', 'pending'] },
    })
      .populate('doctorId', 'name email phone')
      .sort({ startTime: 1 });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

patientRoutes.get('/past', authRequired, requireRole('patient'), async (req, res, next) => {
  try {
    const now = new Date();
    const appointments = await Appointment.find({
      patientId: req.user.id,
      startTime: { $lt: now },
      status: { $in: ['completed', 'cancelled', 'no_show'] },
    })
      .populate('doctorId', 'name email phone')
      .sort({ startTime: -1 });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

patientRoutes.get('/notes', authRequired, requireRole('patient'), async (req, res, next) => {
  try {
    const notes = await Note.find({ patientId: req.user.id })
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });

    // Map to frontend expected format
    const formattedNotes = notes.map(note => ({
      _id: note._id,
      title: note.title || 'Doctor Note',
      content: note.content,
      createdAt: note.createdAt,
      doctorId: note.doctorId,
      attachments: note.prescriptionFile ? [{ filename: 'Prescription', url: note.prescriptionFile }] : []
    }));

    res.json(formattedNotes);
  } catch (err) {
    next(err);
  }
});

/**
 * -----------------------
 * BOOKING FLOW
 * -----------------------
 */
patientRoutes.post(
  '/appointments',
  authRequired,
  requireRole('patient'),
  async (req, res, next) => {
    try {
      const schema = z.object({
        doctorId: z.string().min(1, 'Doctor ID required'),
        availabilityId: z.string().min(1, 'Availability ID required'),
        slotStart: z.coerce.date(),
        reason: z.string().optional(),
      });

      const { doctorId, availabilityId, slotStart, reason } = schema.parse(req.body);

      // Check doctor exists
      const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // Find doctor availability
      const availability = await Availability.findOne({
        _id: availabilityId,
        doctorId,
      });
      if (!availability) {
        return res.status(404).json({ message: 'Availability not found' });
      }

      // Match exact slot by timestamp
      const slot = availability.slots.find(
        (s) => s.start.getTime() === slotStart.getTime()
      );
      if (!slot) {
        return res.status(400).json({ message: 'Slot not found' });
      }
      if (slot.booked) {
        return res.status(409).json({ message: 'Slot already booked' });
      }

      // Create 
      const appointment = await Appointment.create({
        patientId: req.user.id,
        doctorId,
        startTime: slot.start,
        endTime: slot.end,
        status: 'pending',
        reason: reason || null,
        patient: {status: "unpaid"},
      });

      // Mark slot booked
      slot.booked = true;
      await availability.save();

      return res.status(201).json({
        message: 'Appointment booked successfully',
        appointment,
      });
    } catch (err) {
      next(err);
    }
  }
);

patientRoutes.patch('/appointments/:id/cancel', authRequired, requireRole('patient'), async (req, res, next) => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    if (!['booked', 'confirmed', 'pending'].includes(appt.status)) {
      return res.status(400).json({ message: 'Cannot cancel this appointment' });
    }

    appt.status = 'cancelled';
    await appt.save();

    // free up slot in availability
    const availability = await Availability.findOne({
      doctorId: appt.doctorId,
      'slots.start': appt.startTime,
    });
    if (availability) {
      const slot = availability.slots.find(s => s.start.getTime() === appt.startTime.getTime());
      if (slot) {
        slot.booked = false;
        await availability.save();
      }
    }

    res.json({ message: 'Appointment cancelled', appointment: appt });
  } catch (err) {
    next(err);
  }
});

patientRoutes.patch('/appointments/:id/reschedule', authRequired, requireRole('patient'), async (req, res, next) => {
  try {
    const schema = z.object({
      availabilityId: z.string().min(1),
      slotStart: z.coerce.date(),
    });
    const { availabilityId, slotStart } = schema.parse(req.body);

    const appt = await Appointment.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    if (!['booked', 'confirmed', 'pending'].includes(appt.status)) {
      return res.status(400).json({ message: 'Cannot reschedule this appointment' });
    }

    // free old slot
    const oldAvail = await Availability.findOne({
      doctorId: appt.doctorId,
      'slots.start': appt.startTime,
    });
    if (oldAvail) {
      const oldSlot = oldAvail.slots.find(s => s.start.getTime() === appt.startTime.getTime());
      if (oldSlot) {
        oldSlot.booked = false;
        await oldAvail.save();
      }
    }

    // book new slot
    const newAvail = await Availability.findOne({ _id: availabilityId, doctorId: appt.doctorId });
    if (!newAvail) return res.status(404).json({ message: 'New availability not found' });

    const newSlot = newAvail.slots.find(s => s.start.getTime() === slotStart.getTime());
    if (!newSlot) return res.status(400).json({ message: 'Slot not found' });
    if (newSlot.booked) return res.status(409).json({ message: 'Slot already booked' });

    newSlot.booked = true;
    await newAvail.save();

    // update appointment
    appt.startTime = newSlot.start;
    appt.endTime = newSlot.end;
    appt.status = 'booked';
    await appt.save();

    res.json({ message: 'Appointment rescheduled', appointment: appt });
  } catch (err) {
    next(err);
  }
});

/**
 * -----------------------
 * DOCTOR SEARCH
 * -----------------------
 */
patientRoutes.get("/doctor/search", async (req, res, next) => {
  try {
    const schema = z.object({
      hospitalId: z.string().optional(),
      departmentId: z.string().optional(),
      speciality: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
    });

    const { hospitalId, departmentId, speciality, page, limit } = schema.parse(req.query);

    const filter = {};
    if (hospitalId) filter.hospitalId = hospitalId;
    if (departmentId) filter.departmentId = departmentId;
    if (speciality) {
      filter.speciality = { $regex: speciality, $options: "i" };
    }

    const doctors = await DoctorProfile.find(filter)
      .populate("userId", "name email phone")
      .populate("hospitalId", "name location")
      .populate("departmentId", "name")
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await DoctorProfile.countDocuments(filter);

    // Normalize doctor response
    const normalizedDoctors = doctors.map((doc) => ({
      _id: doc._id,
      name: doc.userId?.name || "Unnamed Doctor",
      image: doc.image || null,
      speciality: doc.speciality || null,
      degree: doc.degree || null,
      experience: doc.experience || `${doc.yearsOfExperience || 0} years`, // ✅ prefer string, fallback to years
      fees: doc.fees || 0, 
      rating: doc.rating, // ✅ plural, matches schema + frontend                           
    }));

    res.json({
      items: normalizedDoctors,
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

export default patientRoutes;