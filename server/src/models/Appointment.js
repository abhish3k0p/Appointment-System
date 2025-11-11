import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },

    // Unified scheduling (always use these)
    start: { type: Date, required: true },
    end: { type: Date, required: true },

    status: {
      type: String,
      enum: [
        "pending",
        "booked",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
        "paid",
        "rescheduled",
      ],
      default: "pending",
    },

    reason: String,
    notes: String,
    prescription: String,

    // Reminder flags
    reminderSent24h: { type: Boolean, default: false },
    reminderSent1h: { type: Boolean, default: false },

    // Pending holds
    pendingExpiresAt: { type: Date },

    payment: {
      amount: Number,
      status: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
      txnId: String,
    },

    invoice: { type: String },
  },
  { timestamps: true }
);

// Prevent double booking
appointmentSchema.index(
  { doctorId: 1, start: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "booked", "confirmed", "completed", "rescheduled", "paid"] },
    },
  }
);

// Auto-remove stale pending holds
appointmentSchema.index({ pendingExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Appointment", appointmentSchema);
