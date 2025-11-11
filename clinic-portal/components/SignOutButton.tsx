"use client";

import { useAuthStore } from "@/store/authStore";

export default function SignOutButton() {
  const { logout } = useAuthStore();

  return (
    <button
      onClick={logout}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      Sign Out
    </button>
  );
}
