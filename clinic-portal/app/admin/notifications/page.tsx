"use client";
import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Notification {
  id: number;
  audience: string;
  title: string;
  message: string;
  sentAt: string;
}

export default function AdminNotifications() {
  const [notification, setNotification] = useState({
    audience: "all",
    title: "",
    message: "",
  });

  const [history, setHistory] = useState<Notification[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNotification((prev) => ({ ...prev, [name]: value }));
  };

  const handleSend = () => {
    if (!notification.title || !notification.message) {
      alert("Please enter both title and message!");
      return;
    }
    const newNotification: Notification = {
      id: Date.now(),
      ...notification,
      sentAt: new Date().toLocaleString(),
    };
    // Save in history (mock) — later call backend API
    setHistory((prev) => [newNotification, ...prev]);
    alert(`✅ Notification sent to ${notification.audience}!`);
    setNotification({ audience: "all", title: "", message: "" });
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="p-6 max-w-3xl space-y-8">
        <h1 className="text-2xl font-bold">Notifications Management</h1>
        <p className="text-gray-600">
          Send announcements or alerts to patients, doctors, or everyone.
        </p>
        {/* ===== Notification Form ===== */}
        <div className="space-y-4 border rounded-lg p-4 shadow-sm bg-white">
          {/* Audience */}
          <div>
            <label className="block text-sm font-medium mb-1">Audience</label>
            <select
              name="audience"
              value={notification.audience}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="all">All Users</option>
              <option value="patients">Patients</option>
              <option value="doctors">Doctors</option>
            </select>
          </div>
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={notification.title}
              onChange={handleChange}
              placeholder="Enter notification title"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              name="message"
              value={notification.message}
              onChange={handleChange}
              placeholder="Write your message here..."
              rows={4}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {/* Send Button */}
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Send Notification
          </button>
        </div>
        {/* ===== History Section ===== */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Sent Notifications</h2>
          {history.length === 0 ? (
            <p className="text-gray-500">No notifications sent yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((n) => (
                <div
                  key={n.id}
                  className="border rounded-lg p-4 bg-gray-50 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">
                      Sent: {n.sentAt}
                    </span>
                    <span className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">
                      {n.audience}
                    </span>
                  </div>
                  <h3 className="font-semibold">{n.title}</h3>
                  <p className="text-gray-700 mt-1">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
