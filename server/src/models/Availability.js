import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  booked: { type: Boolean, default: false }
});

const AvailabilitySchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true }, // specific day
  slots: [SlotSchema]
}, { timestamps: true });

export default mongoose.model('Availability', AvailabilitySchema);
