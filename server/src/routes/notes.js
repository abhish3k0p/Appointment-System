import express from "express";
import multer from "multer";
import { authRequired, requireRole } from "../middleware/auth.js";
import Note from "../models/Note.js";

const noteRoutes = express.Router();

// Setup file upload (for PDFs/images)
const upload = multer({ dest: "uploads/prescriptions/" });

// Doctor uploads notes/prescriptions
noteRoutes.post(
  "/:appointmentId",
  authRequired,
  requireRole("doctor"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const note = await Note.create({
        appointmentId: req.params.appointmentId,
        doctorId: req.user.id,
        patientId: req.body.patientId,
        notes: req.body.notes || "",
        prescriptionFile: req.file ? req.file.path : null,
      });
      res.status(201).json(note);
    } catch (err) {
      next(err);
    }
  }
);

// Patient views prescriptions/notes
noteRoutes.get("/my", authRequired, requireRole("patient"), async (req, res, next) => {
  try {
    const notes = await Note.find({ patientId: req.user.id }).populate("doctorId", "name email");
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

export default noteRoutes;
