import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true, unique: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    filePath: { type: String, required: true }, // PDF file location
    status: { type: String, enum: ["paid", "unpaid", "refunded"], default: "paid" },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
