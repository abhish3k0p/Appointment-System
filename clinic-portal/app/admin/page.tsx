"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Hospital, Building2, CalendarDays } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const actions = [
    {
      title: "Manage Users",
      desc: "View and manage doctors and patients",
      icon: <Users className="w-6 h-6 text-blue-600" />,
      href: "/admin/users",
    },
    {
      title: "Manage Hospitals",
      desc: "Add and manage hospitals",
      icon: <Hospital className="w-6 h-6 text-green-600" />,
      href: "/admin/hospitals",
    },
    {
      title: "Manage Departments",
      desc: "Organize departments under hospitals",
      icon: <Building2 className="w-6 h-6 text-purple-600" />,
      href: "/admin/departments",
    },
    {
      title: "View Appointments",
      desc: "Monitor all appointments across the system",
      icon: <CalendarDays className="w-6 h-6 text-red-600" />,
      href: "/admin/appointments",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          Welcome {user?.name || "Admin"}, Admin Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-lg transition cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-3">
                  {action.icon}
                  <CardTitle>{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{action.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </ProtectedRoute>
  );
}
