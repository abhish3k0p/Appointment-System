"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";

interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  start?: string;
  startTime?: string;
  status: string;
}

interface Note {
  _id: string;
  patientId: { _id: string; name: string };
  content: string;
  createdAt: string;
  attachment?: string;
}

interface Patient {
  _id: string;
  name: string;
  email: string;
}

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState<"appointments" | "notes" | "addNote">("appointments");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [apptRes, notesRes, patientsRes] = await Promise.all([
          api.get("/doctor/upcoming"),
          api.get("/doctor/notes"),
          api.get("/doctor/patients"),
        ]);
        // Use all upcoming appointments including completed ones for today
        setAppointments(apptRes.data);
        setNotes(notesRes.data);
        setPatients(patientsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("patientId", selectedPatient);
      formData.append("content", noteContent);
      if (file) formData.append("attachment", file);
      await api.post("/doctor/notes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Note created!");
      setNoteContent("");
      setFile(null);
      setSelectedPatient("");
      // Refresh notes list
      const res = await api.get("/doctor/notes");
      setNotes(res.data);
      setActiveTab("notes");
      // Refresh upcoming appointments to update counts
      const apptRes = await api.get("/doctor/upcoming");
      setAppointments(apptRes.data);
      // Refresh patients list to sync with notes
      const patientsRes = await api.get("/doctor/patients");
      setPatients(patientsRes.data);
    } catch (err) {
      console.error(err);
      alert("Failed to create note.");
    }
  };

  // Calculate appointment stats for today
  const totalToday = appointments.length;
  const completedToday = appointments.filter(appt => appt.status === "completed").length;
  const leftToday = appointments.filter(appt => ["booked", "confirmed", "pending"].includes(appt.status)).length;

  if (loading)
    return (
      <ProtectedRoute allowedRoles={["doctor"]}>
        <div className="p-6">Loading today’s appointments...</div>
      </ProtectedRoute>
    );

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">
          Welcome {user?.name || "Doctor"},🩺
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 border-b mb-4">
          <button
            className={`py-2 px-4 font-medium ${activeTab === "appointments" ? "border-b-2 border-blue-600" : ""
              }`}
            onClick={() => setActiveTab("appointments")}
          >
            Appointments
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === "notes" ? "border-b-2 border-blue-600" : ""
              }`}
            onClick={() => setActiveTab("notes")}
          >
            View Notes
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === "addNote" ? "border-b-2 border-blue-600" : ""
              }`}
            onClick={() => setActiveTab("addNote")}
          >
            Add Note
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "appointments" && (
          <section>
            {/* Appointment stats */}
            <div className="flex space-x-8 mb-4">
              <div className="font-medium text-green-700">Completed: {completedToday}</div>
              <div className="font-medium text-blue-700">Left: {leftToday}</div>
              <div className="font-medium text-gray-700">Total Today: {totalToday}</div>
            </div>

            {appointments.length === 0 ? (
              <p className="text-gray-500">No appointments scheduled for today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded shadow">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-2 text-left">Patient</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">Phone</th>
                      <th className="p-2 text-left">Time</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt._id} className="border-b">
                        <td className="p-2">{appt.patientId.name}</td>
                        <td className="p-2">{appt.patientId.email}</td>
                        <td className="p-2">{appt.patientId.phone || "N/A"}</td>
                        <td className="p-2">{new Date(appt.start || appt.startTime || "").toLocaleString()}</td>
                        <td className="p-2">{appt.status}</td>
                        <td className="p-2">
                          <button
                            onClick={() => {
                              setSelectedPatient(appt.patientId._id);
                              setActiveTab("addNote");
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            Add Note
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "notes" && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Your Notes / Prescriptions</h2>
            {notes.length === 0 ? (
              <p className="text-gray-500">No notes created yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n._id} className="border rounded p-4 bg-gray-50 shadow-sm">
                    <p className="font-medium">Patient: {n.patientId?.name}</p>
                    <p className="text-gray-700 mt-1">{n.content}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    {n.attachment && (
                      <a
                        href={n.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 mt-2 block"
                      >
                        Download Attachment
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "addNote" && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Add New Note / Prescription</h2>
            <form onSubmit={handleAddNote} className="space-y-4">
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                required
                className="border p-2 rounded w-full"
              >
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write note or prescription..."
                required
                className="border p-2 rounded w-full"
              />
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                Save Note
              </button>
            </form>
          </section>
        )}
      </div>
    </ProtectedRoute>
  );
}
