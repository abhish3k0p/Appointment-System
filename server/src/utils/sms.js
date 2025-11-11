import twilio from 'twilio';
import { env } from '../config.js';

const client = twilio(env.TWILIO.SID, env.TWILIO.AUTH_TOKEN);

/**
 * Send an SMS
 * @param {string} to - Recipient phone number (+countrycode)
 * @param {string} message - SMS text body
 */
export async function sendSMS(to, message) {
  try {
    const sms = await client.messages.create({
      body: message,
      from: env.TWILIO.PHONE_NUMBER,
      to: to,
    });
    console.log(`📱 SMS sent: ${sms.sid}`);
    return sms;
  } catch (err) {
    console.error('❌ Error sending SMS:', err);
    throw err;
  }
}
