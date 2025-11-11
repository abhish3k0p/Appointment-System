import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config.js';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import doctorRoutes from './routes/doctor.js';
import appointmentRoutes from './routes/appointments.js';
import { notFound, errorHandler } from './middleware/error.js';

import cron from 'node-cron';
import Appointment from './models/Appointment.js';
import User from './models/User.js';
import { sendEmail } from './utils/email.js';
import { sendSMS } from './utils/sms.js';
import dayjs from 'dayjs';
import noteRoutes from "./routes/notes.js";
import paymentRoutes from "./routes/payments.js";
import patientRoutes from "./routes/patient.js";
import path from "path"; // <-- add this
import { fileURLToPath } from "url"; // needed in ESM
import { dirname } from "path";
import { METHODS } from 'http';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


app.use(helmet());
app.use(cors({
  // origin: "http://localhost:3000", // your frontend
  origin: "https://appointment-system-1-8qyb.onrender.com",
  credentials: true,
  //methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// Serve uploads correctly
app.use("/uploads", (req, res, next) => {
  // res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Origin", "https://appointment-system-1-8qyb.onrender.com");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
}, express.static(path.resolve(__dirname, "../uploads")));

app.use("/patient/uploads", (req, res, next) => {
  // res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Origin", "https://appointment-system-1-8qyb.onrender.com");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
}, express.static(path.resolve(__dirname, "../uploads")));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/patient', patientRoutes);

// Error middleware
app.use(notFound);
app.use(errorHandler);

mongoose.connect(env.MONGO_URI)
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`API running on :${env.PORT}`);

      // Reminder cron job: runs every 5 minutes
      cron.schedule("*/5 * * * *", async () => {
        console.log("[CRON] Checking upcoming appointments...");
        const now = dayjs();
        const in24h = now.add(24, "hour").toDate();

        try {
          const upcoming = await Appointment.find({
            start: { $gte: now.toDate(), $lte: in24h },
            status: { $in: ["booked", "confirmed"] },
          });

          for (const appt of upcoming) {
            const patient = await User.findById(appt.patientId);
            const doctor = await User.findById(appt.doctorId);
            if (!patient || !doctor) continue;

            const startTime = dayjs(appt.start).format("YYYY-MM-DD HH:mm");
            const diffHrs = dayjs(appt.start).diff(now, "hour", true); // float hours

            let reminderType = null;

            // ✅ Send ~24h reminder (within 30 min window)
            if (diffHrs <= 24.5 && diffHrs >= 23.5 && !appt.reminderSent24h) {
              reminderType = "24h";
              appt.reminderSent24h = true;
              await appt.save();
            }

            // ✅ Send ~1h reminder (within 30 min window)
            else if (diffHrs <= 1.5 && diffHrs >= 0.5 && !appt.reminderSent1h) {
              reminderType = "1h";
              appt.reminderSent1h = true;
              await appt.save();
            }

            if (!reminderType) continue;

            // Notify patient
            await sendEmail(
              patient.email,
              `Reminder: Appointment in ${reminderType}`,
              `Hello ${patient.name},\n\nThis is a reminder that you have an appointment with Dr. ${doctor.name} on ${startTime}.`
            );
            await sendSMS(
              patient.phone,
              `Reminder: Appointment with Dr. ${doctor.name} on ${startTime} (${reminderType} left).`
            );

            // Notify doctor
            await sendEmail(
              doctor.email,
              `Reminder: Appointment in ${reminderType}`,
              `Hello Dr. ${doctor.name},\n\nThis is a reminder of your appointment with ${patient.name} on ${startTime}.`
            );
            await sendSMS(
              doctor.phone,
              `Reminder: Appointment with ${patient.name} on ${startTime} (${reminderType} left).`
            );
          }
        } catch (err) {
          console.error("[CRON ERROR]", err);
        }
      });
    });
  })
  .catch((err) => {
    console.error("Mongo connection error", err);
    process.exit(1);
  });