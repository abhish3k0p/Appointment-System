"use client";
import { motion } from "framer-motion";
import Image from "next/image";

interface DoctorCardProps {
  _id: string;
  name: string;
  image: string;
  speciality: string;
  degree: string;
  experience: string;
  fees: number;
  rating: number;
  onSelectDoctor: (doctorId: string) => void; // ✅ fixed prop name
}

export default function DoctorCard({
  _id,
  name,
  image,
  speciality,
  degree,
  experience,
  rating,
  fees,
  onSelectDoctor,
}: DoctorCardProps) {
  const ratingColor =
    rating < 1.7
      ? "bg-red-200 text-red-800"
      : rating < 4
      ? "bg-yellow-200 text-yellow-800"
      : "bg-green-200 text-green-800";

  return (
    <motion.div
      className="mt-8 flex flex-col items-center rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-transform duration-300 bg-gradient-to-br from-blue-50 to-white"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Profile image in a circle */}
      <div className="relative -mt-8 mb-3">
        <Image
          src={image}
          alt={`Dr. ${name}`}
          width={112}
          height={112}
          className="w-28 h-28 rounded-full border-4 border-white shadow-md object-cover object-center"
        />
        <div
          className={
            "absolute bottom-0 right-0 px-2 py-0.5 rounded-full text-xs font-bold shadow " +
            ratingColor
          }
        >
          {rating} ★
        </div>
      </div>

      {/* Main info */}
      <div className="text-center px-5 pb-6 flex flex-col grow w-full">
        <div className="mb-1 text-lg font-bold text-sky-800">{name}</div>
        <div className="text-sm font-medium text-gray-500 mb-2">
          <span className="bg-sky-100 text-sky-700 rounded px-2 py-0.5">
            {speciality}
          </span>
        </div>
        <div className="text-gray-700 text-xs mb-1">{degree}</div>
        <div className="text-gray-500 text-xs mb-2">
          {experience} years experience
        </div>
        <div className="mb-4">
          <span className="text-xl font-semibold text-green-700">₹{fees}</span>
          <span className="ml-1 text-sm font-normal text-gray-400">/ session</span>
        </div>

        {/* Call to action */}
        <button
          onClick={() => onSelectDoctor(_id)}
          className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400 hover:from-sky-600 hover:to-blue-500 transition-colors shadow-sm w-full py-2 mt-auto rounded-full text-white font-bold text-base active:scale-95"
        >
          Book Appointment
        </button>
      </div>
    </motion.div>
  );
}
