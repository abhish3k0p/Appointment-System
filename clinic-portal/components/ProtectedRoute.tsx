"use client";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"patient" | "doctor" | "admin">;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      // Not logged in → go to login
      router.replace("/sign-in");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Logged in but role mismatch → go to their dashboard
      router.replace(`/${user.role}`);
      return;
    }
  }, [user, router, allowedRoles]);

  // Avoid flicker until redirect logic resolves
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
