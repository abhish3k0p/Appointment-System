import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Invoice from "../models/Invoice.js";

export async function generateInvoice({ invoiceId, patient, doctor, appointment, amount }) {
  const dir = path.join("uploads", "invoices");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${invoiceId}.pdf`);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  // Header
  doc.fontSize(18).text("Hospital Booking Invoice", { align: "center" }).moveDown();

  // Invoice metadata
  doc.fontSize(12).text(`Invoice ID: ${invoiceId}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.text(`Amount: $${amount}`).moveDown();

  // Patient + Doctor
  doc.text(`Patient: ${patient.name} (${patient.email})`);
  doc.text(`Doctor: Dr. ${doctor.name} (${doctor.email})`).moveDown();

  // Appointment details
  doc.text(`Appointment Date: ${appointment.start.toLocaleDateString()}`);
  doc.text(`Time: ${appointment.start.toLocaleTimeString()} - ${appointment.end.toLocaleTimeString()}`).moveDown();

  doc.text("Thank you for choosing us!", { align: "center" });
  doc.end();

  // Save invoice in DB
  const invoice = await Invoice.create({
    invoiceId,
    appointmentId: appointment._id,
    patientId: patient._id,
    doctorId: doctor._id,
    amount,
    filePath,
    status: "paid",
  });

  return invoice;
}
