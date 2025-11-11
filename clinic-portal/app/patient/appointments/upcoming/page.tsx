// app/patient/appointments/upcoming/page.tsx
'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Appointment {
  _id: string;
  startTime: string;
  status: string;
  reason?: string;
  doctorId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export default function UpcomingAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/patient/upcoming')
      .then(res => setAppointments(res.data))
      .catch(() => toast.error('Failed to fetch appointments'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!appointments.length) return <div className="p-6">No upcoming appointments.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Upcoming Appointments</h1>
      {appointments.map(appt => (
        <div key={appt._id} className="border p-4 rounded shadow-sm flex justify-between items-center">
          <div>
            <div className="font-semibold text-lg">{new Date(appt.startTime).toLocaleString()}</div>
            <div>Doctor: {appt.doctorId.name}</div>
            <div>Email: {appt.doctorId.email} | Phone: {appt.doctorId.phone}</div>
            {appt.reason && <div className="italic">Reason: {appt.reason}</div>}
          </div>
          <div className={`px-3 py-1 rounded text-white ${appt.status === 'booked' || appt.status === 'confirmed' ? 'bg-green-500' : 'bg-gray-500'}`}>
            {appt.status.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );
}
