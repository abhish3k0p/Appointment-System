// app/patient/notes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import axios from '../../../lib/api';
import { toast } from 'react-hot-toast';

interface Note {
  _id: string;
  title?: string;
  content?: string;
  createdAt: string;
  doctorId: {
    _id: string;
    name: string;
    email: string;
  };
  attachments?: { filename: string; url: string }[];
}

export default function PatientNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/patient/notes')
      .then(res => setNotes(res.data))
      .catch(() => toast.error('Failed to fetch notes'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!notes.length) return <div className="p-6">No notes or prescriptions available.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Notes & Prescriptions</h1>
      {notes.map(note => (
        <div key={note._id} className="border p-4 rounded shadow-sm">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-lg">{note.title || 'Doctor Note'}</div>
            <div className="text-sm text-gray-500">{new Date(note.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="mt-2">Doctor: {note.doctorId.name} ({note.doctorId.email})</div>
          {note.content && <div className="mt-2 italic">{note.content}</div>}
          {note.attachments && note.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="font-medium">Attachments:</div>
              <ul className="list-disc list-inside">
                {note.attachments.map(file => (
                  <li key={file.url}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {file.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
