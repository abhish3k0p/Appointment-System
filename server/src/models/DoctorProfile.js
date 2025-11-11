import mongoose from "mongoose";

// Schema for a time window (used in working hours)
const windowSchema = new mongoose.Schema(
  { start: String, end: String },
  { _id: false }
);

// Weekly working hours schema (Monday-Sunday, each as an array of windows)
const weeklySchema = new mongoose.Schema(
  {
    mon: [windowSchema],
    tue: [windowSchema],
    wed: [windowSchema],
    thu: [windowSchema],
    fri: [windowSchema],
    sat: [windowSchema],
    sun: [windowSchema],
  },
  { _id: false, minimize: false }
);

// Unavailability block schema
const blockSchema = new mongoose.Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    reason: String,
  },
  { _id: false }
);

// ✅ Fixed DoctorProfile schema
const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", default: null },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },

    speciality: { type: String },
    degree: { type: String },             // ✅ added
    image: { type: String },              // ✅ added
    experience: { type: String },         // ✅ added
    fees: { type: Number, default: 0 },   // ✅ added

    bio: { type: String },
    available: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    tz: { type: String, default: "Asia/Kolkata" },
    slotDurationMins: { type: Number, default: 15 },
    workingHours: { type: weeklySchema, default: () => ({}) },
    unavailable: { type: [blockSchema], default: [] },
    unavailableDates: [String], // ISO date strings
  },
  { timestamps: true }
);

// Indexes for fast queries
doctorProfileSchema.index({ speciality: 1 });
doctorProfileSchema.index({ hospitalId: 1, departmentId: 1 });

// Virtual for User reference
doctorProfileSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

export default mongoose.model("DoctorProfile", doctorProfileSchema);
