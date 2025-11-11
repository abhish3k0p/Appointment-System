import express from 'express';
import { z } from 'zod';
import { authRequired, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Appointment from '../models/Appointment.js';
import { hashPassword } from '../middleware/auth.js'; // Assumed utility for hashing passwords
import Invoice from "../models/Invoice.js";
import Hospital from "../models/Hospital.js";
import Department from "../models/Department.js";

const adminRoutes = express.Router();

// Apply auth and role middleware globally for admin routes
adminRoutes.use(authRequired, requireRole('admin'));

// Get doctors grouped by hospital for admin management
adminRoutes.get('/users', async (req, res, next) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate('userId', 'name email phone role address createdAt active')
      .populate('hospitalId', 'name')
      .sort({ createdAt: -1 });

    // Group doctors by hospital
    const groupedByHospital = {};
    doctors.forEach(doctor => {
      const hospitalId = doctor.hospitalId._id.toString();
      if (!groupedByHospital[hospitalId]) {
        groupedByHospital[hospitalId] = {
          hospital: doctor.hospitalId,
          users: []
        };
      }
      groupedByHospital[hospitalId].users.push({
        ...doctor.userId.toObject(),
        address: doctor.userId.address ? `${doctor.userId.address.line1}, ${doctor.userId.address.city}, ${doctor.userId.address.state} ${doctor.userId.address.pincode}` : 'N/A',
        profile: doctor
      });
    });

    res.json(Object.values(groupedByHospital));
  } catch (err) {
    next(err);
  }
});

// Update user status (activate/deactivate)
adminRoutes.patch('/users/:userId', async (req, res, next) => {
  try {
    const schema = z.object({
      active: z.boolean(),
    });

    const { active } = schema.parse(req.body);

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { active },
      { new: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Get user details with related data
adminRoutes.get('/users/:userId', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-passwordHash')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    let additionalData = {};

    if (user.role === 'doctor') {
      const profile = await DoctorProfile.findOne({ userId: user._id })
        .populate('hospitalId', 'name')
        .populate('departmentId', 'name');

      const appointments = await Appointment.find({ doctorId: user._id })
        .populate('patientId', 'name email')
        .sort({ start: -1 })
        .limit(10);

      additionalData = { profile, recentAppointments: appointments };
    } else if (user.role === 'patient') {
      const appointments = await Appointment.find({ patientId: user._id })
        .populate('doctorId', 'name speciality')
        .sort({ start: -1 })
        .limit(10);

      const invoices = await Invoice.find({ patientId: user._id })
        .populate('doctorId', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      additionalData = { recentAppointments: appointments, recentInvoices: invoices };
    }

    // Format address
    const formattedUser = {
      ...user,
      address: user.address ? `${user.address.line1}, ${user.address.city}, ${user.address.state} ${user.address.pincode}` : 'N/A',
      ...additionalData
    };

    res.json(formattedUser);
  } catch (err) {
    next(err);
  }
});

// Only admins can see all invoices
adminRoutes.get("/invoices", authRequired, requireRole("admin"), async (req, res) => {
  try {
    res.json({ message: "WELCOME ADMIN!" });
  } catch (err) {
    next(err);
  }
})


// ---- Doctor Management ----

// Admin creates a doctor account
adminRoutes.post('/doctors', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(6),
      speciality: z.string(),
      hospitalId: z.string(),
    });

    const { name, email, phone, password, speciality, hospitalId } = schema.parse(req.body);

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: await hashPassword(password),
      role: 'doctor',
    });

    const profile = await DoctorProfile.create({
      userId: user._id,
      hospitalId,
      speciality,
      workingHours: [],
      unavailableDates: [],
    });

    res.status(201).json({ doctor: { user, profile } });
  } catch (err) {
    next(err);
  }
});

// Admin sets/updates doctor working hours
adminRoutes.post('/doctor/:doctorId/schedule', async (req, res, next) => {
  try {
    const schema = z.object({
      workingHours: z.array(
        z.object({
          day: z.string(),
          start: z.string(),
          end: z.string(),
        })
      ),
    });

    const { workingHours } = schema.parse(req.body);

    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.params.doctorId },
      { $set: { workingHours } },
      { new: true }
    );

    if (!profile) return res.status(404).json({ message: 'Doctor profile not found' });

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// Admin marks doctor unavailable dates
adminRoutes.post('/doctor/:doctorId/unavailable', async (req, res, next) => {
  try {
    const schema = z.object({ dates: z.array(z.string()) }); // ISO date strings
    const { dates } = schema.parse(req.body);

    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.params.doctorId },
      { $addToSet: { unavailableDates: { $each: dates } } },
      { new: true }
    );

    if (!profile) return res.status(404).json({ message: 'Doctor profile not found' });

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// Admin removes unavailable dates
adminRoutes.delete('/doctor/:doctorId/unavailable', async (req, res, next) => {
  try {
    const schema = z.object({ dates: z.array(z.string()) });
    const { dates } = schema.parse(req.body);

    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.params.doctorId },
      { $pull: { unavailableDates: { $in: dates } } },
      { new: true }
    );

    if (!profile) return res.status(404).json({ message: 'Doctor profile not found' });

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// ---- Admin Dashboard & Analytics ----

// Quick summary counts (patients, doctors, upcoming appointments)
adminRoutes.get('/summary', async (req, res, next) => {
  try {
    const [patientsCount, doctorsCount, upcomingApptsCount] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor' }),
      Appointment.countDocuments({
        status: { $in: ['confirmed', 'booked', 'pending'] },
        start: { $gte: new Date() }
      }),
    ]);
    res.json({ patientsCount, doctorsCount, upcomingApptsCount });
  } catch (err) {
    next(err);
  }
});

// Paginated doctor list with filtering by speciality and hospital
adminRoutes.get('/doctors', async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      speciality: z.string().optional(),
      hospitalId: z.string().optional()
    }).partial();

    const { page = 1, limit = 20, speciality, hospitalId } = schema.parse(req.query);

    const filter = {};
    if (speciality) filter.speciality = speciality;
    if (hospitalId) filter.hospitalId = hospitalId;

    const cursor = DoctorProfile.find(filter)
      .populate('userId', 'name email')
      .skip((page - 1) * limit)
      .limit(limit);

    const items = await cursor.exec();
    const total = await DoctorProfile.countDocuments(filter);

    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// Paginated patient list
adminRoutes.get('/patients', async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20)
    }).partial();

    const { page = 1, limit = 20 } = schema.parse(req.query);

    const users = await User.find({ role: 'patient' })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-passwordHash');

    const total = await User.countDocuments({ role: 'patient' });

    res.json({ users, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// Paginated appointment list with filters
adminRoutes.get('/appointments', async (req, res, next) => {
  try {
    const schema = z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      status: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(50)
    }).partial();

    const { from, to, status, page = 1, limit = 50 } = schema.parse(req.query);

    const filter = {};
    if (from || to) filter.start = {};
    if (from) filter.start.$gte = new Date(from);
    if (to) filter.start.$lte = new Date(to);
    if (status) filter.status = status;

    const items = await Appointment.find(filter)
      .populate('doctorId', 'name')
      .populate('patientId', 'name email')
      .sort({ start: 1 }); // Changed to ascending to sync with patient appointments sorting

    // Sort in memory: upcoming first, then past
    const now = new Date();
    items.sort((a, b) => {
      const aIsUpcoming = a.start > now;
      const bIsUpcoming = b.start > now;
      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;
      if (aIsUpcoming) return a.start - b.start; // earliest first
      return b.start - a.start; // most recent first
    });

    const paginatedItems = items.slice((page - 1) * limit, page * limit);
    const total = items.length;

    res.json({ items: paginatedItems, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// Admin cancel appointment
adminRoutes.put('/appointments/:id/cancel', async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    next(err);
  }
});

// Analytics: Top doctors by appointment counts in date range
adminRoutes.get('/analytics/top-doctors', async (req, res, next) => {
  try {
    const schema = z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      limit: z.coerce.number().default(10)
    }).partial();

    const { from, to, limit = 10 } = schema.parse(req.query);

    const match = { status: { $in: ['confirmed', 'booked', 'completed', 'rescheduled'] } };
    if (from || to) match.start = {};
    if (from) match.start.$gte = new Date(from);
    if (to) match.start.$lte = new Date(to);

    const agg = await Appointment.aggregate([
      { $match: match },
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      { $project: { doctorId: '$_id', doctorName: '$doctor.name', count: 1 } },
    ]);

    res.json(agg);
  } catch (err) {
    next(err);
  }
});

// Analytics: Busiest appointment hours by day and time
adminRoutes.get('/analytics/busiest-hours', async (req, res, next) => {
  try {
    const schema = z.object({
      from: z.string().optional(),
      to: z.string().optional()
    }).partial();

    const { from, to } = schema.parse(req.query);

    const match = { status: { $in: ['confirmed', 'booked', 'completed'] } };
    if (from || to) match.start = {};
    if (from) match.start.$gte = new Date(from);
    if (to) match.start.$lte = new Date(to);

    const agg = await Appointment.aggregate([
      { $match: match },
      { $project: { hour: { $hour: '$start' } } },
      { $group: { _id: '$hour', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(agg.map(r => ({ hour: r._id, count: r.count })));
  } catch (err) {
    next(err);
  }
});

// Analytics: No-shows and cancellations grouped by doctor
adminRoutes.get('/analytics/no-shows', async (req, res, next) => {
  try {
    const schema = z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      limit: z.coerce.number().default(20)
    }).partial();

    const { from, to, limit = 20 } = schema.parse(req.query);

    const match = { status: { $in: ['cancelled', 'no_show'] } };
    if (from || to) match.start = {};
    if (from) match.start.$gte = new Date(from);
    if (to) match.start.$lte = new Date(to);

    const agg = await Appointment.aggregate([
      { $match: match },
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      { $project: { doctorId: '$_id', doctorName: '$doctor.name', count: 1 } },
    ]);

    res.json(agg);
  } catch (err) {
    next(err);
  }
});

// Admin gets all invoices
adminRoutes.get("/invoices", authRequired, requireRole("admin"), async (req, res, next) => {
  try {
    const invoices = await Appointment.find({ invoice: { $exists: true } })
      .populate("doctorId", "name email")
      .populate("patientId", "name email");
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

// ✅ Admin - all invoices
adminRoutes.get("/invoices", authRequired, requireRole("admin"), async (req, res, next) => {
  try {
    const invoices = await Invoice.find()
      .populate("patientId", "name email")
      .populate("doctorId", "name email")
      .populate("appointmentId", "date startTime endTime");
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

adminRoutes.get('/doctor/:doctorId', async (req, res, next) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.params.doctorId })
      .populate('userId', 'name email phone role')
      .populate('hospitalId', 'name');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
});

// Update doctor info
adminRoutes.put('/doctor/:doctorId', async (req, res, next) => {
  try {
    const { speciality, hospitalId, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.doctorId,
      { phone },
      { new: true }
    );
    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.params.doctorId },
      { speciality, hospitalId },
      { new: true }
    );
    res.json({ user, profile });
  } catch (err) {
    next(err);
  }
});

// Deactivate doctor
adminRoutes.patch('/doctor/:doctorId/deactivate', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.doctorId,
      { active: false },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
});

adminRoutes.get('/patients/:patientId', async (req, res, next) => {
  try {
    const patient = await User.findById(req.params.patientId)
      .select('-passwordHash')
      .lean();
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const appointments = await Appointment.find({ patientId: patient._id })
      .populate('doctorId', 'name email speciality')
      .sort({ start: -1 });

    const invoices = await Invoice.find({ patientId: patient._id })
      .populate('doctorId', 'name email')
      .populate('appointmentId', 'start');

    res.json({ patient, appointments, invoices });
  } catch (err) {
    next(err);
  }
});

// Deactivate patient
adminRoutes.patch('/patients/:patientId/deactivate', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.patientId,
      { active: false },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
});

adminRoutes.get('/doctor/:doctorId', async (req, res, next) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.params.doctorId })
      .populate('userId', 'name email phone role active')
      .populate('hospitalId', 'name');

    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
});

// Update doctor info (speciality, hospital, phone)
adminRoutes.put('/doctor/:doctorId', async (req, res, next) => {
  try {
    const schema = z.object({
      speciality: z.string().optional(),
      hospitalId: z.string().optional(),
      phone: z.string().optional(),
    }).partial();

speciality
    const user = await User.findByIdAndUpdate(
      req.params.doctorId,
      { ...(phone && { phone }) },
      { new: true }
    );

    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.params.doctorId },
      { ...(speciality && { speciality }), ...(hospitalId && { hospitalId }) },
      { new: true }
    );

    if (!profile) return res.status(404).json({ message: 'Doctor profile not found' });

    res.json({ user, profile });
  } catch (err) {
    next(err);
  }
});

// Deactivate / Reactivate doctor
adminRoutes.patch('/doctor/:doctorId/status', async (req, res, next) => {
  try {
    const schema = z.object({ active: z.boolean() });
    const { active } = schema.parse(req.body);

    const user = await User.findByIdAndUpdate(
      req.params.doctorId,
      { active },
      { new: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'Doctor not found' });

    res.json(user);
  } catch (err) {
    next(err);
  }
});


// ==============================
// 🔹 PATIENT MANAGEMENT EXTENSIONS
// ==============================

// Get patient by ID (with appointments + invoices)
adminRoutes.get('/patients/:patientId', async (req, res, next) => {
  try {
    const patient = await User.findById(req.params.patientId)
      .select('-passwordHash');

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const appointments = await Appointment.find({ patientId: patient._id })
      .populate('doctorId', 'name email sspecialitypecialization')
      .sort({ start: -1 });

    const invoices = await Invoice.find({ patientId: patient._id })
      .populate('doctorId', 'name email')
      .populate('appointmentId', 'start end');

    res.json({ patient, appointments, invoices });
  } catch (err) {
    next(err);
  }
});

// Deactivate / Reactivate patient
adminRoutes.patch('/patients/:patientId/status', async (req, res, next) => {
  try {
    const schema = z.object({ active: z.boolean() });
    const { active } = schema.parse(req.body);

    const user = await User.findByIdAndUpdate(
      req.params.patientId,
      { active },
      { new: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'Patient not found' });

    res.json(user);
  } catch (err) {
    next(err);
  }
});

adminRoutes.post("/hospitals", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      address: z.object({
        line1: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        pincode: z.string().min(1),
      }),
      phone: z.string().optional(),
    });

    const { name, address, phone } = schema.parse(req.body);

    const hospital = await Hospital.create({ name, address, phone });
    res.status(201).json(hospital);
  } catch (err) {
    next(err);
  }
});

// Get all hospitals (with departments) - filtered by admin's hospital
adminRoutes.get("/hospitals", async (req, res, next) => {
  try {
    const hospitals = await Hospital.find({ _id: req.user.hospitalId }).populate("departments");
    // Format address for display if it exists
    const formattedHospitals = hospitals.map(hospital => ({
      ...hospital.toObject(),
      address: hospital.address ? `${hospital.address.line1}, ${hospital.address.city}, ${hospital.address.state} ${hospital.address.pincode}` : 'N/A'
    }));
    res.json(formattedHospitals);
  } catch (err) {
    next(err);
  }
});

// Get single hospital
adminRoutes.get("/hospitals/:hospitalId", async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId)
      .populate("departments");
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });
    res.json(hospital);
  } catch (err) {
    next(err);
  }
});

// Update hospital
adminRoutes.put("/hospitals/:hospitalId", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      address: z.object({
        line1: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
      }).optional(),
      phone: z.string().optional(),
    }).partial();

    const data = schema.parse(req.body);

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.hospitalId,
      { $set: data },
      { new: true }
    );

    if (!hospital) return res.status(404).json({ message: "Hospital not found" });
    res.json(hospital);
  } catch (err) {
    next(err);
  }
});

// Delete hospital (only if no doctors are linked)
adminRoutes.delete("/hospitals/:hospitalId", async (req, res, next) => {
  try {
    const doctorCount = await DoctorProfile.countDocuments({ hospitalId: req.params.hospitalId });
    if (doctorCount > 0) {
      return res.status(400).json({ message: "Cannot delete hospital with linked doctors" });
    }

    await Hospital.findByIdAndDelete(req.params.hospitalId);
    res.json({ message: "Hospital deleted" });
  } catch (err) {
    next(err);
  }
});

// ==============================
// 🔹 DEPARTMENT MANAGEMENT
// ==============================

// Create department (linked to admin's hospital)
adminRoutes.post("/hospitals/:hospitalId/departments", async (req, res, next) => {
  try {
    const schema = z.object({ name: z.string().min(2) });
    const { name } = schema.parse(req.body);

    // Check if the hospitalId matches the admin's hospital
    if (req.params.hospitalId !== req.user.hospitalId.toString()) {
      return res.status(403).json({ message: "You can only manage departments for your hospital" });
    }

    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    const department = await Department.create({ name, hospitalId: hospital._id });

    // Add department to hospital
    hospital.departments.push(department._id);
    await hospital.save();

    res.status(201).json(department);
  } catch (err) {
    next(err);
  }
});

// Get departments of the admin's hospital
adminRoutes.get("/departments", async (req, res, next) => {
  try {
    const departments = await Department.find({ hospitalId: req.user.hospitalId });
    res.json(departments);
  } catch (err) {
    next(err);
  }
});

// Update department
adminRoutes.put("/departments/:deptId", async (req, res, next) => {
  try {
    const schema = z.object({ name: z.string().optional() }).partial();
    const data = schema.parse(req.body);

    const dept = await Department.findByIdAndUpdate(req.params.deptId, { $set: data }, { new: true });
    if (!dept) return res.status(404).json({ message: "Department not found" });

    res.json(dept);
  } catch (err) {
    next(err);
  }
});

adminRoutes.delete("/departments/:deptId", async (req, res, next) => {
  try {
    const doctorCount = await DoctorProfile.countDocuments({ departmentId: req.params.deptId });
    if (doctorCount > 0) {
      return res.status(400).json({ message: "Cannot delete department with linked doctors" });
    }

    // Delete department
    await Department.findByIdAndDelete(req.params.deptId);

    // Remove department from hospital's departments array
    await Hospital.updateMany(
      { departments: req.params.deptId },
      { $pull: { departments: req.params.deptId } }
    );

    res.json({ message: "Department deleted and hospital updated" });
  } catch (err) {
    next(err);
  }
});

adminRoutes.post("/doctor/profile", async (req, res, next) => {
  try {
    const schema = z.object({
      userId: z.string().min(1),
      hospitalId: z.string().min(1),
      departmentId: z.string().min(1),
      speciality: z.string().optional(),
      yearsOfExperience: z.number().int().optional(),
      bio: z.string().optional()
    });

    const data = schema.parse(req.body);

    // Check hospital + department exist
    const hospital = await Hospital.findById(data.hospitalId);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    const department = await Department.findOne({ _id: data.departmentId, hospitalId: hospital._id });
    if (!department) return res.status(404).json({ message: "Department not found in this hospital" });

    const profile = await DoctorProfile.create(data);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
});

// Update doctor’s hospital/department assignment
adminRoutes.put("/doctor/:id/profile", async (req, res, next) => {
  try {
    const schema = z.object({
      hospitalId: z.string().optional(),
      departmentId: z.string().optional(),
      speciality: z.string().optional(),
      yearsOfExperience: z.number().int().optional(),
      bio: z.string().optional(),
      isActive: z.boolean().optional()
    }).partial();

    const updates = schema.parse(req.body);

    // If hospitalId or departmentId is provided, validate relationship
    if (updates.hospitalId || updates.departmentId) {
      const hospitalId = updates.hospitalId;
      const departmentId = updates.departmentId;

      if (hospitalId && departmentId) {
        const department = await Department.findOne({ _id: departmentId, hospitalId });
        if (!department) {
          return res.status(400).json({ message: "Department does not belong to this hospital" });
        }
      }
    }

    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.params.id },
      { $set: updates },
      { new: true }
    ).populate("hospitalId departmentId");

    if (!profile) return res.status(404).json({ message: "Doctor profile not found" });

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// Get all doctors with hospital + department info
adminRoutes.get("/doctors", async (req, res, next) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate("userId", "name email")
      .populate("hospitalId", "name")
      .populate("departmentId", "name");
    res.json(doctors);
  } catch (err) {
    next(err);
  }
});

export default adminRoutes;
