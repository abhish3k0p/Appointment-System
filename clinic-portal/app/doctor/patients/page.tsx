"use client";
import { useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Appointment {
  _id: string;
  doctorId: { name: string };
  start?: string;
  startTime?: string;
  status: string;
}

interface Note {
  _id: string;
  content: string;
  createdAt: string;
  attachments?: string[];
}

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function PatientHistoryPage() {
  const [query, setQuery] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Step 1: search patient (you’ll need a backend endpoint for this, or load from /doctor/patients)
      const allPatients = await api.get("/doctor/patients");
      const found = allPatients.data.find(
        (p: Patient) =>
          p.email.toLowerCase() === query.toLowerCase() ||
          p.name.toLowerCase().includes(query.toLowerCase())
      );

      if (!found) {
        alert("No patient found");
        setLoading(false);
        return;
      }

      // Step 2: fetch history in one call
      const res = await api.get(`/doctor/patients/${found._id}/history`);
      setPatient(res.data.patient);
      setAppointments(res.data.appointments || []);
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error(err);
      alert("Error fetching patient history");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Patient History Lookup</h1>

        {/* Search Box */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter patient email or name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded px-4 py-2 flex-1"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {loading && <p>Loading...</p>}

        {patient && (
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="border p-4 rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold">Patient Info</h2>
              <p>
                <strong>Name:</strong> {patient.name}
              </p>
              <p>
                <strong>Email:</strong> {patient.email}
              </p>
              <p>
                <strong>Phone:</strong> {patient.phone || "N/A"}
              </p>
            </div>

            {/* Appointments */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Appointments</h2>
              {appointments.length === 0 ? (
                <p className="text-gray-500">No appointments found.</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((a) => (
                    <div key={a._id} className="border p-4 rounded-lg shadow-sm">
                      <p>
                        <strong>Doctor:</strong> {a.doctorId?.name}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(a.start || a.startTime || "").toLocaleString()}
                      </p>
                      <p>
                        <strong>Status:</strong> {a.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Notes & Prescriptions</h2>
              {notes.length === 0 ? (
                <p className="text-gray-500">No notes found.</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div
                      key={n._id}
                      className="border p-4 rounded-lg bg-gray-50 shadow-sm"
                    >
                      <p className="text-gray-700">{n.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                      {n.attachments && n.attachments.length > 0 && (
                        <div className="mt-2 space-x-2">
                          {n.attachments.map((file, idx) => (
                            <a
                              key={idx}
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-sm"
                            >
                              Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
