// app/admin/billing/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface InvoiceDetail {
  _id: string;
  appointmentId: {
    _id: string;
    startTime: string;
    endTime: string;
    patientId: { name: string; email: string; phone?: string };
    doctorId: { name: string; email: string; speciality?: string };
    reason?: string;
  };
  amount: number;
  status: "paid" | "pending" | "cancelled";
  createdAt: string;
  payments: {
    _id: string;
    method: string;
    amount: number;
    date: string;
    status: string;
  }[];
}

export default function InvoiceDetailPage() {
  const { token } = useAuthStore();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;

    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/admin/billing/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoice(res.data);
      } catch (err) {
        console.error("Failed to fetch invoice", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [token, id]);

  if (loading) return <p className="p-4">Loading invoice...</p>;
  if (!invoice) return <p className="p-4">Invoice not found.</p>;

  const { appointmentId, amount, status, createdAt, payments } = invoice;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Invoice Details</h1>

      <Card className="p-4">
        <h2 className="font-semibold text-lg">
          Patient: {appointmentId.patientId.name} <br />
          Doctor: {appointmentId.doctorId.name} ({appointmentId.doctorId.speciality})
        </h2>
        <p className="text-sm text-gray-600">
          Appointment: {new Date(appointmentId.startTime).toLocaleString()} -{" "}
          {new Date(appointmentId.endTime).toLocaleString()}
        </p>
        {appointmentId.reason && <p className="mt-1">Reason: {appointmentId.reason}</p>}
        <p className="mt-2">💰 Amount: ₹{amount}</p>
        <p
          className={`mt-1 font-semibold ${
            status === "paid"
              ? "text-green-600"
              : status === "pending"
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          Status: {status.toUpperCase()}
        </p>
        <p className="text-sm text-gray-500">Created: {new Date(createdAt).toLocaleString()}</p>
      </Card>

      <h2 className="text-xl font-semibold">Payment History</h2>
      <div className="space-y-2">
        {payments.length === 0 ? (
          <p>No payments recorded yet.</p>
        ) : (
          payments.map((p) => (
            <Card key={p._id} className="p-3 flex justify-between items-center">
              <div>
                <p>
                  Method: {p.method} | Amount: ₹{p.amount}
                </p>
                <p className="text-sm text-gray-500">
                  Date: {new Date(p.date).toLocaleString()} | Status: {p.status}
                </p>
              </div>
              {status === "pending" && (
                <Button size="sm" variant="default">
                  Mark as Paid
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
