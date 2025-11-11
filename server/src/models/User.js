import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true, default: 'patient' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }, // For admins, link to their hospital
  permissions: [{ type: String }],
  verified: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
avatarUrl: {
  type: String,
  default: `${process.env.BASE_URL || "http://localhost:4000"}/uploads/default-avatar.png`,
},
}, { timestamps: true });

export default mongoose.model('User', userSchema);
