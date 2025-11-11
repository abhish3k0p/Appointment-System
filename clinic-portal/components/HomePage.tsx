"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const role = user.role;
      if (role === "patient") router.replace("/patient");
      else if (role === "doctor") router.replace("/doctor");
      else if (role === "admin") router.replace("/admin");
    }
  }, [user, router]);

  return (
    <div className="flex flex-col items-center justify-center text-center text-white mt-20">
      <h1 className="text-4xl font-bold">Welcome to the Clinic Portal</h1>
      <p className="mt-4 text-lg max-w-xl">
        Book appointments, manage schedules, and track your health — all in one place.
      </p>
    </div>
  );
}
