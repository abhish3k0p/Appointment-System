"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const role = user.role;
      if (role === "patient") router.replace("/patient");
      else if (role === "doctor") router.replace("/doctor");
      else if (role === "admin") router.replace("/admin");
    }
  }, [user, router]);

  // If logged in, show logout and redirect message
  if (user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold">Redirecting...</h1>
        <p className="mt-2 text-gray-600">If you are not redirected, use the menu.</p>
        <button
          onClick={logout}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Sign Out
        </button>
      </main>
    );
  }

  // If not logged in, show landing page content
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold">Welcome to the Clinic Portal</h1>
        <p className="mt-4 text-lg max-w-xl">
          Book appointments, manage schedules, and keep track of your health — all in one place.
        </p>
        <div className="flex gap-4 mt-6 justify-center">
          <Link
            href="/sign-in"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
