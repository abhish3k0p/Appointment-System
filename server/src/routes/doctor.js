import express from 'express';
import multer from 'multer';
import path from 'path';
import { authRequired, requireRole } from '../middleware/auth.js';
import Appointment from '../models/Appointment.js';
import Note from '../models/Note.js';
import User from '../models/User.js';
import Availability from '../models/Availability.js';
import { z } from 'zod';
import DoctorProfile from "../models/DoctorProfile.js";

const doctorRoutes = express.Router();

// Setup file upload (for PDFs/images)
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/prescriptions/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  })
});

doctorRoutes.get("/", async (req, res, next) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate("userId", "name email") // attach doctor’s user info
      .populate("hospitalId", "name"); // optional hospital info

    res.json(doctors);
  } catch (err) {
    console.error("Error fetching doctors:", err);
    next(err);
  }
});

// GET doctor profile (auto-create if missing)
doctorRoutes.get("/profile", authRequired, async (req, res) => {
  try {
    let profile = await DoctorProfile.findOne({ userId: req.user.id });

    if (!profile) {
      profile = await DoctorProfile.create({
        userId: req.user.id || "",
        name: req.user.name, // default from user
        email: req.user.email, // from user model
        image: "",
        speciality: "",
        degree: "",
        experience: "",
        about: "",
        fees: 0,
        available: true,
        address: {
          line1: "",
        },
      });
    }

    res.json(profile);
  } catch (err) {
    console.error("Fetch doctor profile error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// GET /doctor/appointments/today
doctorRoutes.get("/appointments/today", authRequired, requireRole("doctor"), async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    doctorId: req.user.id,
    $or: [
      { start: { $gte: startOfDay, $lte: endOfDay } },
      { startTime: { $gte: startOfDay, $lte: endOfDay } },
    ],
  })
    .populate("patientId", "name email phone")
    .sort({ start: 1, startTime: 1, createdAt: 1 }); // Sort by time, then by booking order

  res.json(appointments);
});
// GET /doctor/patients
doctorRoutes.get("/patients", authRequired, requireRole("doctor"), async (req, res) => {
  const appointments = await Appointment.find({ doctorId: req.user.id }).populate("patientId", "name email phone");
  const uniquePatients = [
    ...new Map(appointments.map(appt => [appt.patientId._id.toString(), appt.patientId])).values(),
  ];
  res.json(uniquePatients);
});


// GET /doctor/upcoming - Doctor’s upcoming appointments supporting start and startTime fields
doctorRoutes.get('/upcoming', authRequired, requireRole('doctor'), async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctorId: req.user.id,
      $or: [
        // Upcoming appointments
        {
          $and: [
            { $or: [{ start: { $gte: now } }, { startTime: { $gte: now } }] },
            { status: { $in: ['booked', 'confirmed', 'pending'] } }
          ]
        },
        // Completed appointments for today
        {
          $and: [
            { $or: [{ start: { $gte: startOfDay, $lte: endOfDay } }, { startTime: { $gte: startOfDay, $lte: endOfDay } }] },
            { status: 'completed' }
          ]
        }
      ]
    })
      .populate('patientId', 'name email phone')
      .sort({ start: 1, startTime: 1 });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

// GET /doctor/past - Doctor’s past appointments
doctorRoutes.get('/past', authRequired, requireRole('doctor'), async (req, res, next) => {
  try {
    const now = new Date();
    const appointments = await Appointment.find({
      doctorId: req.user.id,
      $or: [
        { start: { $lt: now } },
        { startTime: { $lt: now } }
      ],
      status: { $in: ['completed', 'cancelled', 'no_show'] }
    })
      .populate('patientId', 'name email phone')
      .sort({ start: -1, startTime: -1 });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

// GET /doctor/notes - Notes/prescriptions written by the doctor
doctorRoutes.get('/notes', authRequired, requireRole('doctor'), async (req, res, next) => {
  try {
    const { patientEmail } = req.query;
    let query = { doctorId: req.user.id };

    if (patientEmail) {
      // Find patient by email
      const User = (await import('../models/User.js')).default;
      const patient = await User.findOne({ email: patientEmail, role: 'patient' });
      if (patient) {
        query.patientId = patient._id;
      } else {
        return res.json([]); // No patient found, return empty
      }
    }

    const notes = await Note.find(query)
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

// POST /doctor/notes - Create a new note/prescription (general, not tied to appointment)
doctorRoutes.post('/notes', authRequired, requireRole('doctor'), upload.single('attachment'), async (req, res, next) => {
  try {
    const { patientId, content } = req.body;
    if (!patientId || !content) {
      return res.status(400).json({ message: 'patientId and content are required' });
    }

    const note = await Note.create({
      doctorId: req.user.id,
      patientId,
      content,
      prescriptionFile: req.file ? `/uploads/prescriptions/${req.file.filename}` : null,
    });

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// GET /doctor/patients/:id/history - Patient history with this doctor (appointments & notes)
doctorRoutes.get('/patients/:id/history', authRequired, requireRole('doctor'), async (req, res, next) => {
  try {
    const patientId = req.params.id;

    const appointments = await Appointment.find({
      doctorId: req.user.id,
      patientId
    }).sort({ start: -1, startTime: -1 });

    const notes = await Note.find({
      doctorId: req.user.id,
      patientId
    }).sort({ createdAt: -1 });

    const patient = await User.findById(patientId).select('name email phone');

    res.json({ patient, appointments, notes });
  } catch (err) {
    next(err);
  }
});

// PATCH /doctor/appointments/:id/confirm - accept/reject appointment
doctorRoutes.patch('/appointments/:id/confirm', authRequired, requireRole('doctor'), async (req, res, next) => {
  try {
    const schema = z.object({
      action: z.enum(['accept', 'reject']),
    });
    const { action } = schema.parse(req.body);

    const appt = await Appointment.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    if (appt.status !== 'pending' && appt.status !== 'booked') {
      return res.status(400).json({ message: 'Appointment already processed' });
    }

    if (action === 'accept') {
      appt.status = 'confirmed';
    } else {
      appt.status = 'cancelled';
    }
    await appt.save();

    res.json({ message: `Appointment ${action}ed`, appointment: appt });
  } catch (err) {
    next(err);
  }
});

// PATCH /doctor/appointments/:id/complete - mark completed or no_show
doctorRoutes.patch('/appointments/:id/complete', authRequired, requireRole('doctor'), async (req, res, next) => {
  try {
    const schema = z.object({
      outcome: z.enum(['completed', 'no_show']),
    });
    const { outcome } = schema.parse(req.body);

    const appt = await Appointment.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    if (!['confirmed', 'booked'].includes(appt.status)) {
      return res.status(400).json({ message: 'Cannot mark this appointment as completed' });
    }

    appt.status = outcome;
    await appt.save();

    res.json({ message: `Appointment marked as ${outcome}`, appointment: appt });
  } catch (err) {
    next(err);
  }
});

/**
 * ------------------------
 * NOTES / PRESCRIPTIONS
 * ------------------------
 */

// POST /doctor/appointments/:id/notes - write a note for patient
doctorRoutes.post('/appointments/:id/notes', authRequired, requireRole('doctor'), upload.single('file'), async (req, res, next) => {
  try {
    const schema = z.object({
      content: z.string().min(5, 'Note must have content'),
    });
    const { content } = schema.parse(req.body);

    const appt = await Appointment.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    const note = await Note.create({
      doctorId: req.user.id,
      patientId: appt.patientId,
      appointmentId: appt._id,
      content,
      prescriptionFile: req.file ? `/uploads/prescriptions/${req.file.filename}` : null,
    });

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// PATCH /doctor/notes/:id - update a note
doctorRoutes.patch('/notes/:id', authRequired, requireRole('doctor'), async (req, res, next) => {
  try {
    const schema = z.object({
      content: z.string().min(5),
    });
    const { content } = schema.parse(req.body);

    const note = await Note.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    note.content = content;
    await note.save();

    res.json({ message: 'Note updated', note });
  } catch (err) {
    next(err);
  }
});

/**
 * ------------------------
 * AVAILABILITY MANAGEMENT
 * ------------------------
 */

// POST /doctor/availability - create availability slots with overlap checks
doctorRoutes.post(
  '/availability',
  authRequired,
  requireRole('doctor'),
  async (req, res, next) => {
    try {
      const schema = z.object({
        date: z.coerce.date(),
        slots: z.array(
          z.object({
            start: z.coerce.date(),
            end: z.coerce.date(),
          })
        ),
      });

      let { date, slots } = schema.parse(req.body);

      // normalize date
      date.setHours(0, 0, 0, 0);

      // attach booked: false to all incoming slots
      slots = slots.map((s) => ({ ...s, booked: false }));

      // 1. Validate slots (no overlaps inside request)
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].end <= slots[i].start) {
          return res.status(400).json({ message: 'Slot end must be after start' });
        }
        for (let j = i + 1; j < slots.length; j++) {
          if (slots[i].start < slots[j].end && slots[j].start < slots[i].end) {
            return res.status(400).json({ message: 'Overlapping slots in request' });
          }
        }
      }

      // 2. Check overlaps with existing slots in DB
      const existing = await Availability.findOne({
        doctorId: req.user.id,
        date,
      });

      if (existing) {
        for (const newSlot of slots) {
          for (const oldSlot of existing.slots) {
            if (newSlot.start < oldSlot.end && oldSlot.start < newSlot.end) {
              return res
                .status(400)
                .json({ message: 'Overlaps existing availability slot' });
            }
          }
        }

        // If no overlap → append new slots
        existing.slots.push(...slots);
        await existing.save();
        return res.status(201).json(existing);
      }

      // 3. Create new availability if none exists for date
      const availability = await Availability.create({
        doctorId: req.user.id,
        date,
        slots,
      });

      res.status(201).json(availability);
    } catch (err) {
      next(err);
    }
  }
);



// GET /doctor/availability - doctor views their own slots
doctorRoutes.get('/availability', authRequired, requireRole('doctor'), async (req, res, next) => {
  try {
    const availability = await Availability.find({ doctorId: req.user.id })
      .sort({ date: 1 });
    res.json(availability);
  } catch (err) {
    next(err);
  }
});

// PATCH /doctor/availability/:id - update availability (replace slots)
doctorRoutes.patch('/availability/:id', authRequired, requireRole('doctor'), async (req, res, next) => {
  try {
    const schema = z.object({
      slots: z.array(z.object({
        start: z.coerce.date(),
        end: z.coerce.date(),
      }))
    });
    const { slots } = schema.parse(req.body);

    const availability = await Availability.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!availability) return res.status(404).json({ message: 'Availability not found' });

    // You might want to add overlap checks here too before saving

    availability.slots = slots;
    await availability.save();

    res.json({ message: 'Availability updated', availability });
  } catch (err) {
    next(err);
  }
});

/**
 * ------------------------
 * PUBLIC ENDPOINT (patient side)
 * ------------------------
 */

// GET /doctor/:id/availability - patient views available slots of doctor
doctorRoutes.get('/:id/availability', async (req, res, next) => {
  try {
    const { date } = req.query;

    // 1. Find doctor profile and get userId
    const profile = await DoctorProfile.findById(req.params.id).select('userId');
    if (!profile) return res.status(404).json({ message: 'Doctor not found' });

    // 2. Build query for Availability
    const query = { doctorId: profile.userId };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    // 3. Fetch availability
    const availability = await Availability.findOne(query).select('slots').lean();
    const slots = availability?.slots?.filter(slot => !slot.booked).map(slot => ({
      startTime: slot.start.toISOString(),
      endTime: slot.end.toISOString(),
    })) || [];

    // 4. Return in frontend-friendly format
    res.json({ slots });
  } catch (err) {
    next(err);
  }
});



// DELETE /doctor/availability/:slotId - remove a slot (only if not booked)
doctorRoutes.delete('/availability/:slotId', authRequired, requireRole('doctor'), async (req, res, next) => {
  try {
    const { slotId } = req.params;

    // Find doctor’s availability containing this slot
    const availability = await Availability.findOne({
      doctorId: req.user.id,
      'slots._id': slotId
    });

    if (!availability) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Find slot inside array
    const slot = availability.slots.id(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // If booked → cannot delete
    if (slot.booked) {
      return res.status(400).json({ message: 'Cannot delete a booked slot' });
    }

    // Remove slot and save
    slot.deleteOne();
    await availability.save();

    res.json({ message: 'Slot deleted successfully', availability });
  } catch (err) {
    next(err);
  }
});


export default doctorRoutes;
