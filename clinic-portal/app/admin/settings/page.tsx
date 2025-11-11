"use client";
import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: "Clinic Portal",
    contactEmail: "support@clinic.com",
    paymentGateway: "Stripe",
    maintenanceMode: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, type } = e.target;

  if (type === "checkbox") {
    // TypeScript knows e.target is HTMLInputElement here
    const checked = (e.target as HTMLInputElement).checked;
    setSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  } else {
    // for inputs (text, etc) and select elements
    const value = e.target.value;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
};

  const handleSave = () => {
    // Save settings via backend API
    console.log("Saving settings...", settings);
    alert("Settings updated successfully!");
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="p-6 space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <div className="space-y-4">
          {/* Site Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Site Name</label>
            <input
              type="text"
              name="siteName"
              value={settings.siteName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              value={settings.contactEmail}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {/* Payment Gateway */}
          <div>
            <label className="block text-sm font-medium mb-1">Payment Gateway</label>
            <select
              name="paymentGateway"
              value={settings.paymentGateway}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Stripe">Stripe</option>
              <option value="PayPal">PayPal</option>
              <option value="Razorpay">Razorpay</option>
            </select>
          </div>
          {/* Maintenance Mode */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <label className="text-sm font-medium">Enable Maintenance Mode</label>
          </div>
          {/* Save Button */}
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            Save Settings
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
