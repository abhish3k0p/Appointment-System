import nodemailer from 'nodemailer';
import { env } from '../config.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP.HOST,
  port: env.SMTP.PORT,
  secure: env.SMTP.SECURE === 'true', // true for port 465, false for others like 587
  auth: {
    user: env.SMTP.USER,
    pass: env.SMTP.PASS,
  },
});

// /**
//  * Send an email with optional attachments
//  * @param {string} to - Recipient email address
//  * @param {string} subject - Email subject line
//  * @param {string} text - Plain text email body
//  * @param {Array} attachments - Optional array of attachment objects, e.g. [{ filename: 'invoice.pdf', path: '/path/to/file.pdf' }]
//  */
export async function sendEmail(to, subject, text, attachments = []) {
  const mailOptions = {
    from: env.SMTP.FROM || `"Hospital System" <${env.SMTP.USER}>`,
    to,
    subject,
    text,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('❌ Error sending email:', err);
    throw err;
  }
}
