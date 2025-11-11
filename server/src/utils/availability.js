import express from 'express';
import { z } from 'zod';
import DoctorProfile from '../models/DoctorProfile.js';
import Appointment from '../models/Appointment.js';

const router = express.Router();

// Get available slots for a doctor on a given date
router.get('/doctor/:doctorId', async (req, res, next) => {
  try {
    const schema = z.object({ date: z.string() }); // ISO date string (YYYY-MM-DD)
    const { date } = schema.parse(req.query);

    // Find doctor profile
    const profile = await DoctorProfile.findOne({ userId: req.params.doctorId });
    if (!profile) return res.status(404).json({ message: 'Doctor profile not found' });

    // Check if doctor is unavailable on this date
    if (profile.unavailableDates?.includes(date)) {
      return res.json({ slots: [] });
    }

    // Determine the day of the week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const workingDay = profile.workingHours.find(w => w.day === dayOfWeek);

    if (!workingDay) return res.json({ slots: [] }); // Doctor does not work on this day

    // Generate 30-min slots
    const slotDuration = 30; // minutes
    const slots = [];
    let current = new Date(`${date}T${workingDay.start}:00`);
    const end = new Date(`${date}T${workingDay.end}:00`);

    while (current < end) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + slotDuration * 60000);

      if (slotEnd <= end) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      current = slotEnd;
    }

    // Fetch appointments already booked on that date
    const appointments = await Appointment.find({
      doctorId: req.params.doctorId,
      status: { $in: ['booked', 'pending'] },
      startTime: { $gte: new Date(`${date}T00:00:00Z`) },
      endTime: { $lte: new Date(`${date}T23:59:59Z`) },
    });

    // Map booked intervals
    const bookedTimes = appointments.map(a => ({
      start: a.startTime.getTime(),
      end: a.endTime.getTime(),
    }));

    // Filter out overlapping slots
    const freeSlots = slots.filter(slot => {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();

      return !bookedTimes.some(b =>
        (slotStart < b.end && slotEnd > b.start) // overlap check
      );
    });

    res.json({ slots: freeSlots });
  } catch (err) {
    next(err);
  }
});

export default router;
