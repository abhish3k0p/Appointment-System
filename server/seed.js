import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Hospital from './src/models/Hospital.js';
import User from './src/models/User.js';
import DoctorProfile from './src/models/DoctorProfile.js';
import Availability from './src/models/Availability.js';
import Department from './src/models/Department.js';
import { hashPassword } from './src/middleware/auth.js';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // 🔄 Clear old data
    await Promise.all([
      User.deleteMany({}),
      DoctorProfile.deleteMany({}),
      Hospital.deleteMany({}),
      Availability.deleteMany({}),
      Department.deleteMany({}),
    ]);

    // 🏥 Hospital
    const hospital = await Hospital.create({
      name: 'Demo Hospital',
      tz: 'Asia/Kolkata',
      address: {
        line1: '123 Health St',
        city: 'Sample City',
        state: 'Sample State',
        pincode: '123456',
      },
    });

    // 🏥 Create Departments
    const departmentNames = ['Cardiology', 'Neurology', 'Dentist'];
    const departments = [];
    for (const name of departmentNames) {
      const dept = await Department.create({ name, hospitalId: hospital._id });
      departments.push(dept._id);
    }

    // Link departments to hospital
    hospital.departments = departments;
    await hospital.save();

    // 🆔 Predefined IDs
    const ids = {
      patientAlice: new mongoose.Types.ObjectId('68d2866517c12807f93e8280'),
      doctorBob: new mongoose.Types.ObjectId('68d2866517c12807f93e8281'),
      doctorCarol: new mongoose.Types.ObjectId('68d2866517c12807f93e8282'),
      doctorDan: new mongoose.Types.ObjectId('68d2866517c12807f93e8283'),
      adminCarol: new mongoose.Types.ObjectId('68d2866517c12807f93e8284'),
      doctorMohan: new mongoose.Types.ObjectId('68d2866517c12807f93e8285'),
      doctorRRB: new mongoose.Types.ObjectId('68d2866517c12807f93e8286'),
      doctorShilpa: new mongoose.Types.ObjectId('68d2866517c12807f93e8287'),
      doctorSam: new mongoose.Types.ObjectId('68d2866517c12807f93e8288'),
      doctorMohit: new mongoose.Types.ObjectId('68d2866517c12807f93e8289'),
      doctorPawan: new mongoose.Types.ObjectId('68d2866517c12807f93e8290'),
    };

    // 👤 Users
    await User.create([
      { _id: ids.patientAlice, name: 'Alice Patient', email: 'abhi4k0p@gmail.com', phone: '+919973411222', passwordHash: await hashPassword('123456'), role: 'patient' },
      { _id: ids.doctorBob, name: 'Dr. Bob', email: 'bob@demo.com', phone: '+1234567891', passwordHash: await hashPassword('123456'), role: 'doctor' },
      { _id: ids.doctorCarol, name: 'Dr. Carol', email: 'carol@demo.com', phone: '+1234567892', passwordHash: await hashPassword('123456'), role: 'doctor' },
      { _id: ids.doctorDan, name: 'Dr. Dan', email: 'dan@demo.com', phone: '+1234567893', passwordHash: await hashPassword('123456'), role: 'doctor' },
      { _id: ids.adminCarol, name: 'Carol Admin', email: 'admin@demo.com', phone: '+1234567894', passwordHash: await hashPassword('123456'), role: 'admin', hospitalId: hospital._id },
      { _id: ids.doctorMohan, name: 'Dr. Mohan', email: 'mohan@demo.com', phone: '+1234567895', passwordHash: await hashPassword('123456'), role: 'doctor' },
      { _id: ids.doctorRRB, name: 'Dr. RRB', email: 'rrb@demo.com', phone: '+1234567896', passwordHash: await hashPassword('123456'), role: 'doctor' },
      { _id: ids.doctorShilpa, name: 'Dr. Shilpa', email: 'shilpa@demo.com', phone: '+1234567897', passwordHash: await hashPassword('123456'), role: 'doctor' },
      { _id: ids.doctorSam, name: 'Dr. Sam', email: 'sam@demo.com', phone: '+1234567898', passwordHash: await hashPassword('123456'), role: 'doctor' },
      { _id: ids.doctorMohit, name: 'Dr. Mohit', email: 'mohit@demo.com', phone: '+1234567899', passwordHash: await hashPassword('123456'), role: 'doctor' },
      { _id: ids.doctorPawan, name: 'Dr. Pawan', email: 'pawan@demo.com', phone: '+917597625882', passwordHash: await hashPassword('123456'), role: 'doctor' },
    ]);

    // 👨‍⚕️ Doctor profiles data
    const doctorsData = [
      { speciality: 'Cardiology', image: '/doctor/doc2.jpg', degree: 'MD', rating: 4, experience: 10, fees: 1000 },
      { speciality: 'Neurology', image: '/doctor/doc1.jpg', degree: 'DM', rating: 5, experience: 8, fees: 1200 },
      { speciality: 'Dentist', image: '/doctor/doc3.jpeg', degree: 'BDS', rating: 3, experience: 5, fees: 800 },
      { speciality: 'Dentist', image: '/doctor/doc4.png', degree: 'BDS', rating: 3, experience: 5, fees: 800 },
      { speciality: 'Neurology', image: '/doctor/doc5.png', degree: 'BDS', rating: 3, experience: 5, fees: 800 },
      { speciality: 'Cardiology', image: '/doctor/doc6.jpeg', degree: 'BDS', rating: 3, experience: 5, fees: 800 },
      { speciality: 'Cardiology', image: '/doctor/doc7.jpeg', degree: 'MBBS', rating: 1, experience: 5, fees: 800 },
      { speciality: 'Cardiology', image: '/doctor/doc8.png', degree: 'BDS', rating: 2, experience: 5, fees: 800 },
      { speciality: 'Cardiology', image: '/doctor/doc9.jpeg', degree: 'MBBS', rating: 3, experience: 5, fees: 800 },
      { speciality: 'Neurology', image: '/doctor/doc10.jpeg', degree: 'MD', rating: 4, experience: 7, fees: 1000 },
      { speciality: 'Dentist', image: '/doctor/doc11.jpeg', degree: 'BDS', rating: 3, experience: 6, fees: 900 },
    ];

    const defaultWorkingHours = {
      mon: [{ start: '09:00', end: '17:00' }],
      tue: [{ start: '09:00', end: '17:00' }],
      wed: [{ start: '09:00', end: '17:00' }],
      thu: [{ start: '09:00', end: '17:00' }],
      fri: [{ start: '09:00', end: '17:00' }],
      sat: [],
      sun: [],
    };

    const doctorIds = [
      ids.doctorBob, ids.doctorCarol, ids.doctorDan,
      ids.doctorMohan, ids.doctorRRB, ids.doctorShilpa,
      ids.doctorSam, ids.doctorMohit, ids.doctorPawan,
    ];

    // 🕒 Slot generator (30 mins each, 9am–5pm)
    function generateSlots(baseDate) {
      const slots = [];
      const startHour = 9;
      const endHour = 17;

      for (let hour = startHour; hour < endHour; hour++) {
        // 9:00 → 9:30
        let start = new Date(baseDate);
        start.setHours(hour, 0, 0, 0);
        let end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
        slots.push({ start, end, booked: false });

        // 9:30 → 10:00
        start = new Date(baseDate);
        start.setHours(hour, 30, 0, 0);
        end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
        slots.push({ start, end, booked: false });
      }

      return slots;
    }

    // 📅 Create availability for next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < doctorIds.length; i++) {
      await DoctorProfile.create({
        userId: doctorIds[i],
        hospitalId: hospital._id,
        ...doctorsData[i % doctorsData.length],
        slotDurationMins: 30,
        workingHours: defaultWorkingHours,
        unavailableDates: [],
      });

      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() + d);

        await Availability.create({
          doctorId: doctorIds[i],
          date,
          slots: generateSlots(date),
        });
      }
    }

    console.log('✅ Seed completed: users, doctors, profiles, 7-day availability');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();