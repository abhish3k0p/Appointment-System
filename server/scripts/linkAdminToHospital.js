import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Hospital from '../src/models/Hospital.js';

async function linkAdminToHospital() {
  try {
    // Connect to MongoDB (adjust connection string if needed)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');

    // Find the demo hospital
    const hospital = await Hospital.findOne({ name: 'Demo Hospital' });
    if (!hospital) {
      console.log('Demo Hospital not found');
      return;
    }

    // Find the demo admin (assuming email or name)
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Admin not found');
      return;
    }

    // Update admin with hospitalId
    admin.hospitalId = hospital._id;
    await admin.save();

    console.log(`Admin ${admin.name} linked to hospital ${hospital.name}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error linking admin to hospital:', error);
  }
}

linkAdminToHospital();
