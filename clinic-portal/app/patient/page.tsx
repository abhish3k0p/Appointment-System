"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaCalendarPlus, FaFileMedical } from "react-icons/fa";

export default function PatientDashboard() {
  const { user } = useAuthStore();

  const cards = [
    {
      title: "Book Appointment",
      description: "Schedule a new appointment with your doctor",
      icon: <FaCalendarPlus size={32} />,
      href: "/patient/book",
      color: "from-blue-400 to-blue-700",
    },
    {
      title: "View Prescriptions",
      description: "Check your medical notes and prescriptions",
      icon: <FaFileMedical size={32} />,
      href: "/patient/notes",
      color: "from-green-400 to-green-700",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      {/* Vibrant top bar for dashboard accent */}
      <div className="w-full h-2 bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-500 rounded-t-lg shadow-xl"></div>
      {/* Soft gradient background with subtle texture */}
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-bl from-sky-100 via-white to-green-50 relative overflow-hidden">
        {/* Greeting */}
        <div className="mb-10 mt-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow text-slate-700">
            Welcome, <span className="bg-gradient-to-r from-blue-500 via-green-500 to-blue-400 bg-clip-text text-transparent">{user?.name || "Patient"}</span> 👋
          </h1>
          <div className="mt-2 text-lg text-gray-700 opacity-80 font-medium">
            Simplifying your healthcare journey
          </div>
        </div>
        {/* Stylish cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl px-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`
                relative group rounded-2xl shadow-lg p-8 flex flex-col bg-white/50 
                border border-white/60 backdrop-blur-xl transition-transform
                hover:scale-105 hover:shadow-2xl ring-1 ring-blue-100/40
                before:absolute before:inset-0 before:rounded-2xl 
                before:bg-gradient-to-br before:opacity-75 
                before:-z-10 before:${card.color}
              `}
              style={{ minHeight: "185px" }}
            >
              <div className="mb-5">{card.icon}</div>
              <h2 className="text-2xl font-semibold mb-2 drop-shadow-sm">
                {card.title}
              </h2>
              <p className="text-base opacity-90">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
