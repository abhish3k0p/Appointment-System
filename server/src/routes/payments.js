import express from "express";
import Stripe from "stripe";
import { authRequired, requireRole } from "../middleware/auth.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { env } from "../config.js";
import { generateInvoice } from "../utils/invoice.js";
import { sendEmail } from "../utils/email.js";
import { sendSMS } from "../utils/sms.js";
import dayjs from "dayjs";
import path from "path";
import DoctorProfile from "../models/DoctorProfile.js";

const paymentRoutes = express.Router();
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

paymentRoutes.post(
  "/create-checkout-session",
  authRequired,
  requireRole("patient"),
  async (req, res, next) => {
    try {
      const { appointmentId } = req.body;

      if (!env.FRONTEND_URL || !env.FRONTEND_URL.startsWith('http')) {
        return res.status(500).json({ message: "FRONTEND_URL not properly configured" });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) return res.status(404).json({ message: "Appointment not found" });

      const doctorProfile = await DoctorProfile.findOne({ userId: appointment.doctorId });
      if (!doctorProfile) return res.status(404).json({ message: "Doctor profile not found" });

      const amount = doctorProfile.fees || 100; // fallback if not set

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Appointment with Dr. ${doctorProfile.name || doctorProfile._id}`,
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        success_url: `${env.FRONTEND_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.FRONTEND_URL}/patient/book?status=cancel`,
        metadata: { appointmentId: appointment._id.toString() },
      });

      res.json({ url: session.url });
    } catch (err) {
      next(err);
    }
  }
);


// Stripe Webhook to confirm payment and generate invoice
paymentRoutes.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const appointmentId = session.metadata.appointmentId;
      const amount = session.amount_total / 100;

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) return;

      const patient = await User.findById(appointment.patientId);
      const doctor = await User.findById(appointment.doctorId);

      // ✅ Mark paid & booked
      appointment.status = "booked";
      appointment.payment = {
        status: "paid",
        amount,
        stripeSessionId: session.id,
      };
      await appointment.save();

      // ✅ Generate invoice
      const invoiceId = `INV-${Date.now()}`;
      const invoicePath = generateInvoice({
        invoiceId,
        patient,
        doctor,
        appointment,
        amount,
        date: dayjs().format("YYYY-MM-DD HH:mm"),
      });

      appointment.invoice = invoicePath;
      await appointment.save();

      // ✅ Email invoice
      await sendEmail(
        patient.email,
        "Your Appointment Invoice",
        `Hello ${patient.name},\n\nThank you for your payment of $${amount} for your appointment with Dr. ${doctor.name}.`,
        [{ filename: path.basename(invoicePath), path: invoicePath }]
      );

      // ✅ Send booking confirmation
      const appointmentDateTime = appointment.start.toLocaleString();
      await sendEmail(
        patient.email,
        "Appointment Confirmation",
        `Your appointment with Dr. ${doctor.name} is confirmed for ${appointmentDateTime}.`
      );
      await sendSMS(patient.phone, `Appointment confirmed: ${appointmentDateTime} with Dr. ${doctor.name}`);

      await sendEmail(
        doctor.email,
        "New Appointment Confirmed",
        `A new appointment with patient ${patient.name} is confirmed for ${appointmentDateTime}.`
      );
      await sendSMS(doctor.phone, `Appointment confirmed with ${patient.name} on ${appointmentDateTime}.`);

      console.log(`📧 Invoice emailed to ${patient.email}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Mock payment success endpoint (alternative to webhook)
paymentRoutes.post("/success", authRequired, requireRole("patient"), async (req, res, next) => {
  try {
    const { appointmentId, amount } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    // Check if already processed (e.g., by webhook)
    if (appointment.status === "booked" && appointment.payment?.status === "paid") {
      return res.json({ message: "Appointment already confirmed" });
    }

    // Mark appointment as paid
    appointment.status = "booked";
    appointment.payment = {
      status: "paid",
      amount,
      stripeSessionId: null, // or some id
    };
    await appointment.save();

    const patient = await User.findById(appointment.patientId);
    const doctor = await User.findById(appointment.doctorId);

    // Generate invoice
    const invoiceId = `INV-${Date.now()}`;
    const invoice = await generateInvoice({
      invoiceId,
      patient,
      doctor,
      appointment,
      amount,
    });

    appointment.invoice = invoice.filePath;
    await appointment.save();

    // Send booking confirmation email with invoice attached
    const appointmentDateTime = appointment.start.toLocaleString();
    await sendEmail(
      patient.email,
      "Appointment Confirmation",
      `Hello ${patient.name},\n\nThank you for your payment of $${amount} for your appointment with Dr. ${doctor.name}.\n\nYour appointment is confirmed for ${appointmentDateTime}.\n\nThe invoice is attached.`,
      [{ filename: path.basename(invoice.filePath), path: invoice.filePath }]
    );

    // Send SMS to patient if phone exists
    if (patient.phone) {
      await sendSMS(patient.phone, `Appointment confirmed: ${appointmentDateTime} with Dr. ${doctor.name}`);
    } else {
      console.log(`📱 SMS not sent to patient ${patient.name}: phone not provided`);
    }

    // Send email to doctor
    await sendEmail(
      doctor.email,
      "New Appointment Confirmed",
      `A new appointment with patient ${patient.name} is confirmed for ${appointmentDateTime}.`
    );

    // Send SMS to doctor if phone exists
    if (doctor.phone) {
      await sendSMS(doctor.phone, `Appointment confirmed with ${patient.name} on ${appointmentDateTime}.`);
    } else {
      console.log(`📱 SMS not sent to doctor ${doctor.name}: phone not provided`);
    }

    console.log(`📧 Confirmation email sent to ${patient.email}`);
    console.log(`📱 SMS sent to ${patient.phone}`);

    res.json({ message: "Payment successful, confirmation sent", invoice });
  } catch (err) {
    next(err);
  }
});

paymentRoutes.get("/session/:sessionId", authRequired, requireRole("patient"), async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const appointmentId = session.metadata?.appointmentId;
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    res.json({ appointmentId, amount });
  } catch (err) {
    next(err);
  }
});

export default paymentRoutes;
