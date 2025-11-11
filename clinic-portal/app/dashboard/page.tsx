"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function DashboardRedirect() {
  const { user } = useAuthStore();
  const router = useRouter();
  const role = user?.role;

  useEffect(() => {
    if (!user) {
      // Not logged in, you can decide to redirect or stay here
      // Example: router.replace("/sign-in");
      return;
    }
    if (role === "patient") router.replace("/patient");
    else if (role === "doctor") router.replace("/doctor");
    else if (role === "admin") router.replace("/admin");
    else router.replace("/"); // fallback
  }, [user, role, router]);

  return <p className="p-6">Redirecting to your dashboard...</p>;
}
