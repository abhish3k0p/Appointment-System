"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

interface Doctor {
  _id: string;
  name: string;
}

interface Appointment {
  _id: string;
  doctorId: Doctor;
  start?: string;
  startTime?: string;
  status: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "booked":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "confirmed":
      return "bg-green-100 text-green-800 border-green-200";
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    case "no_show":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments/my");
      const appts = res.data;
      // Sort: upcoming first (earliest), then past (most recent)
      const now = new Date();
      appts.sort((a: Appointment, b: Appointment) => {
        const aDate = new Date(a.start || a.startTime || "");
        const bDate = new Date(b.start || b.startTime || "");
        const aIsUpcoming = aDate > now;
        const bIsUpcoming = bDate > now;
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;
        if (aIsUpcoming) return aDate.getTime() - bDate.getTime(); // earliest first
        return bDate.getTime() - aDate.getTime(); // most recent first
      });
      setAppointments(appts);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const cancelAppointment = async (id: string) => {
    try {
      await api.post(`/appointments/${id}/cancel`);
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch {
      toast.error("Failed to cancel");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">My Appointments</h1>
      {appointments.length === 0 ? (
        <p className="text-center text-gray-500">No appointments yet</p>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const date = new Date(appt.start || appt.startTime || "").toLocaleString();
            const isUpcoming = new Date(appt.start || appt.startTime || "") > new Date();
            return (
              <Card key={appt._id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{appt.doctorId?.name}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appt.status)}`}>
                      {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-800">{date}</p>
                    <p className="text-sm text-gray-600">
                      {isUpcoming ? "Upcoming Appointment" : "Past Appointment"}
                    </p>
                  </div>
                </CardContent>
                {(appt.status === "pending" || appt.status === "booked" || appt.status === "confirmed") && (
                  <CardFooter>
                    <button
                      onClick={() => cancelAppointment(appt._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancel Appointment
                    </button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
