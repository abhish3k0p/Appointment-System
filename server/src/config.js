import dotenv from 'dotenv';
dotenv.config();


export const env = {
PORT: process.env.PORT || 4000,
MONGO_URI: process.env.MONGO_URI,
JWT_SECRET: process.env.JWT_SECRET,
JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
DEFAULT_TZ: process.env.DEFAULT_TZ || 'Asia/Kolkata',
SMTP: {
HOST: process.env.SMTP_HOST,
PORT: Number(process.env.SMTP_PORT || 587),
SECURE: process.env.SMTP_SECURE,
USER: process.env.SMTP_USER,
PASS: process.env.SMTP_PASS,
FROM: process.env.SMTP_FROM,
},
TWILIO: {
SID: process.env.TWILIO_SID,
AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
},
STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
FRONTEND_URL: process.env.FRONTEND_URL,
};
