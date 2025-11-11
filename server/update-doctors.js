import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import DoctorProfile from './src/models/DoctorProfile.js';

async function updateDoctors() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await DoctorProfile.updateMany({}, { available: true });

    console.log('✅ All doctor profiles set to available: true');
  } catch (err) {
    console.error('❌ Error updating doctors:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

updateDoctors();
