"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface Availability {
  _id?: string;
  day: string;
  startTime: string;
  endTime: string;
}

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/doctor/availability").then((res) => {
      setAvailability(res.data || []);
      setLoading(false);
    });
  }, []);

  const handleChange = (index: number, field: keyof Availability, value: string) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const handleSave = async () => {
    await api.post("/doctor/availability", { availability });
    alert("Availability updated successfully!");
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Manage Availability</h1>

        <div className="space-y-4">
          {daysOfWeek.map((day, idx) => {
            const entry = availability.find((a) => a.day === day) || {
              day,
              startTime: "",
              endTime: "",
            };
            return (
              <div
                key={day}
                className="flex items-center gap-4 border rounded-lg p-4"
              >
                <span className="w-32 font-medium">{day}</span>
                <input
                  type="time"
                  value={entry.startTime}
                  onChange={(e) =>
                    handleChange(idx, "startTime", e.target.value)
                  }
                  className="border rounded px-3 py-1"
                />
                <span>to</span>
                <input
                  type="time"
                  value={entry.endTime}
                  onChange={(e) => handleChange(idx, "endTime", e.target.value)}
                  className="border rounded px-3 py-1"
                />
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Save Availability
        </button>
      </div>
    </ProtectedRoute>
  );
}
