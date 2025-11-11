// app/admin/billing/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface Invoice {
  _id: string;
  appointmentId: {
    _id: string;
    startTime: string;
    endTime?: string;
    patientId: { name: string; email?: string };
    doctorId: { name: string; email?: string };
  };
  amount: number;
  status: "paid" | "pending" | "cancelled";
  createdAt?: string;
}

export default function AdminBillingPage() {
  const { token } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchInvoices = async () => {
      try {
        const res = await api.get("/admin/billing", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(res.data);
      } catch (err) {
        console.error("Failed to fetch invoices", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [token]);

  if (loading) return <p className="p-4">Loading invoices...</p>;

  if (invoices.length === 0) return <p className="p-4">No invoices found.</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Billing & Invoices</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice._id} className="p-4 shadow-md rounded-xl flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-lg">
                {invoice.appointmentId.patientId?.name} → {invoice.appointmentId.doctorId?.name}
              </h2>
              {invoice.appointmentId.startTime && invoice.appointmentId.endTime && (
                <p className="text-sm text-gray-500">
                  Appointment:{" "}
                  {new Date(invoice.appointmentId.startTime).toLocaleString()} -{" "}
                  {new Date(invoice.appointmentId.endTime).toLocaleString()}
                </p>
              )}
              {invoice.createdAt && (
                <p className="text-sm text-gray-600">
                  Created: {new Date(invoice.createdAt).toLocaleDateString()}
                </p>
              )}
              <p className="mt-2">💰 Amount: ₹{invoice.amount}</p>
              <p
                className={`mt-1 font-semibold ${
                  invoice.status === "paid"
                    ? "text-green-600"
                    : invoice.status === "pending"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                Status: {invoice.status.toUpperCase()}
              </p>
            </div>
            <div className="mt-3 flex gap-2 items-center">
              {invoice.status === "pending" && (
                <Button size="sm" variant="default">
                  Mark as Paid
                </Button>
              )}
              <Link
                href={`/admin/billing/${invoice._id}`}
                className="text-blue-600 hover:underline text-sm"
              >
                View Details
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
