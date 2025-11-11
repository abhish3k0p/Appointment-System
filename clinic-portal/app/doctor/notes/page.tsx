"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Note {
  _id: string;
  content: string;
  createdAt: string;
  patientId: { _id: string; name: string; email: string };
  prescriptionFile?: string;
}

export default function DoctorNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatedContent, setUpdatedContent] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  const fetchNotes = async (patientEmail?: string) => {
    try {
      setLoading(true);
      const params = patientEmail ? { patientEmail } : {};
      const res = await api.get("/doctor/notes", { params });
      setNotes(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter a patient email");
      return;
    }
    fetchNotes(searchEmail.trim());
  };

  const handleEdit = (note: Note) => {
    setEditingId(note._id);
    setUpdatedContent(note.content);
  };

  const handleSave = async (id: string) => {
    try {
      await api.patch(`/doctor/notes/${id}`, { content: updatedContent });
      toast.success("Note updated successfully");
      setEditingId(null);
      fetchNotes(searchEmail.trim()); // Refetch with current search
    } catch (err) {
      console.error(err);
      toast.error("Failed to update note");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Notes & Prescriptions</h1>

        {/* Search by Patient Email */}
        <div className="border p-4 rounded-lg bg-gray-50 space-y-3">
          <h2 className="text-lg font-semibold">Search Notes by Patient Email</h2>
          <div className="flex space-x-2">
            <input
              type="email"
              className="border rounded p-2 flex-1"
              placeholder="Enter patient email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Search
            </button>
          </div>
        </div>

        {/* Existing Notes */}
        {loading ? (
          <p>Loading...</p>
        ) : notes.length === 0 ? (
          <p>No notes found. Use the search above to find notes for a specific patient.</p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note._id}
                className="border p-4 rounded-lg shadow-sm bg-gray-50"
              >
                <p>
                  <strong>Patient:</strong> {note.patientId.name} ({note.patientId.email})
                </p>
                <p>
                  <strong>Created:</strong> {new Date(note.createdAt).toLocaleString()}
                </p>

                {note.prescriptionFile && (
                  <p className="mt-1">
                    <a
                      href={note.prescriptionFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Prescription
                    </a>
                  </p>
                )}

                {editingId === note._id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      className="w-full border rounded p-2"
                      value={updatedContent}
                      onChange={(e) => setUpdatedContent(e.target.value)}
                    />
                    <button
                      onClick={() => handleSave(note._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-gray-400 text-white rounded ml-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-gray-700">{note.content}</p>
                    <button
                      onClick={() => handleEdit(note)}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
