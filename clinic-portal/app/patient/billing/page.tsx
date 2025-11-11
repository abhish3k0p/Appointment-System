"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Invoice {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function PatientBilling() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    api.get("/patient/invoices").then((res) => setInvoices(res.data));
  }, []);

  const handlePay = async (id: string) => {
    try {
      const res = await api.post(`/payments/create-checkout-session`, {
        invoiceId: id,
      });
      window.location.href = res.data.url; // Redirect to Stripe Checkout
    } catch (err) {
      console.error("Payment failed", err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">My Invoices</h1>
        {invoices.length === 0 ? (
          <p className="text-gray-500">No invoices found.</p>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div
                key={inv._id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">Invoice #{inv._id}</p>
                  <p className="text-sm text-gray-600">
                    Amount: ${inv.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  {inv.status === "paid" ? (
                    <span className="px-3 py-1 rounded bg-green-100 text-green-700 text-sm">
                      Paid
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePay(inv._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
