"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      toast.error("Invalid session");
      router.push("/");
      return;
    }

    const confirmPayment = async () => {
      try {
        // Get session details from backend
        const { data } = await api.get(`/payments/session/${sessionId}`);
        const { appointmentId, amount } = data;

        if (!appointmentId) throw new Error("Appointment ID not found");

        // Call the success endpoint to send confirmations
        await api.post("/payments/success", { appointmentId, amount });

        toast.success("Confirmation sent! Check your email and SMS.");
        setProcessing(false);

        // Redirect after showing success
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } catch (err: unknown) {
        console.error("Confirmation error:", err);
        const error = err as { message?: string };
        toast.error(error.message || "Failed to send confirmation. Please contact support.");
        setProcessing(false);
        setTimeout(() => {
          router.push("/");
        }, 5000);
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Booking Successful! 🎉</h1>
        {processing ? (
          <p className="text-gray-700 mb-4">Processing confirmation... Please wait.</p>
        ) : (
          <p className="text-gray-700 mb-4">
            Your appointment has been confirmed. You will receive a confirmation email with invoice and SMS shortly.
          </p>
        )}
        <p className="text-sm text-gray-500">
          You will be redirected to the home page in a few seconds. If not, <Link href="/" className="text-blue-600">click here</Link>.
        </p>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
          <p>Loading...</p>
        </div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}
