import mongoose from 'mongoose';


const addressSchema = new mongoose.Schema({
line1: String,
city: String,
state: String,
pincode: String,
}, { _id: false });


const hospitalSchema = new mongoose.Schema({
name: { type: String, required: true },
tz: { type: String, default: 'Asia/Kolkata' },
address: addressSchema,
departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }]
}, { timestamps: true });


export default mongoose.model('Hospital', hospitalSchema);