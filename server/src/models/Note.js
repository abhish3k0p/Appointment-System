import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String }, // text notes
    prescriptionFile: { type: String }, // URL or file path (PDF/image)
  },
  { timestamps: true }
);

export default mongoose.model("Note", noteSchema);
