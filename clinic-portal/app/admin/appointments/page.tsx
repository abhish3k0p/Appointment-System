// app/admin/appointments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface Appointment {
  _id: string;
  start: string;
  status: string;
  doctorId: {
    _id: string;
    name: string;
  };
  patientId: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/appointments");
      setAppointments(res.data.items || []);
    } catch (err) {
      console.error("Error fetching appointments", err);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      await api.put(`/admin/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (err) {
      console.error("Error cancelling appointment", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">System-wide Appointments</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : appointments.length === 0 ? (
            <p>No appointments found.</p>
          ) : (
            <table className="w-full text-left border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Patient</th>
                  <th className="p-2 border">Doctor</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt._id}>
                    <td className="p-2 border">
                      {new Date(appt.start).toLocaleString()}
                    </td>
                    <td className="p-2 border">
                      {appt.patientId.name} <br />
                      <span className="text-sm text-gray-500">{appt.patientId.email}</span>
                    </td>
                    <td className="p-2 border">
                      {appt.doctorId.name}
                    </td>
                    <td className="p-2 border">{appt.status}</td>
                    <td className="p-2 border">
                      {appt.status === "booked" ? (
                        <Button
                          variant="destructive"
                          onClick={() => cancelAppointment(appt._id)}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
