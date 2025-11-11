"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
interface Patient {
    _id: string;
    name: string;
    email: string;
    phone: string;
}
interface Appointment {
    _id: string;
    patientId: Patient;
    start?: string; // ISO datetime
    startTime?: string; // alternative datetime field
    status: string;
}
export default function DoctorAppointmentsPage() {
    const [today, setToday] = useState<Appointment[]>([]);
    const [upcoming, setUpcoming] = useState<Appointment[]>([]);
    const [past, setPast] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const fetchAppointments = async () => {
        try {
            const [todayRes, upcomingRes, pastRes] = await Promise.all([
                api.get("/doctor/appointments/today"),
                api.get("/doctor/upcoming"),
                api.get("/doctor/past"),
            ]);
            setToday(todayRes.data);
            setUpcoming(upcomingRes.data);
            setPast(pastRes.data);
        } catch {
            toast.error("Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchAppointments();
    }, []);
    const handleConfirm = async (id: string, action: "accept" | "reject") => {
        try {
            await api.patch(`/doctor/appointments/${id}/confirm`, { action });
            toast.success(`Appointment ${action}ed`);
            fetchAppointments();
        } catch {
            toast.error("Failed to update appointment");
        }
    };
    const handleComplete = async (id: string, outcome: "completed" | "no_show") => {
        try {
            await api.patch(`/doctor/appointments/${id}/complete`, { outcome });
            toast.success(`Marked as ${outcome}`);
            fetchAppointments();
        } catch {
            toast.error("Failed to update appointment");
        }
    };
    const renderList = (title: string, appts: Appointment[], actions = true) => (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            {appts.length === 0 ? (
                <p className="text-gray-500">No appointments</p>
            ) : (
                <ul className="space-y-3">
                    {appts.map((appt) => {
                        const date = new Date(appt.start || appt.startTime || "").toLocaleString();
                        return (
                            <li key={appt._id} className="border rounded p-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{appt.patientId?.name}</p>
                                    <p className="text-sm text-gray-600">{date}</p>
                                    <p className="text-sm text-gray-500">Status: {appt.status}</p>
                                </div>
                                {actions && (
                                    <div className="space-x-2">
                                        {appt.status === "pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleConfirm(appt._id, "accept")}
                                                    className="px-3 py-1 bg-green-600 text-white rounded"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleConfirm(appt._id, "reject")}
                                                    className="px-3 py-1 bg-red-600 text-white rounded"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {(appt.status === "confirmed" || appt.status === "booked") && (
                                            <>
                                                <button
                                                    onClick={() => handleComplete(appt._id, "completed")}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded"
                                                >
                                                    Complete
                                                </button>
                                                <button
                                                    onClick={() => handleComplete(appt._id, "no_show")}
                                                    className="px-3 py-1 bg-gray-600 text-white rounded"
                                                >
                                                    No Show
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
    if (loading) {
        return <div className="p-6">Loading appointments...</div>;
    }
    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Appointments</h1>
            {renderList("Today's Appointments", today)}
            {renderList("Upcoming Appointments", upcoming)}
            {renderList("Past Appointments", past, false)}
        </div>
    );
}