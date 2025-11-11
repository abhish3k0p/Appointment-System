"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { navLinks } from "@/lib/navLinks";
import { Home, Calendar, FileText, User, Users, Building, Folder, Settings } from "lucide-react";

interface SidebarProps {
  open: boolean;
}

const iconMap = {
  Dashboard: Home,
  Appointments: Calendar,
  Prescriptions: FileText,
  Prescription: FileText,
  Profile: User,
  Patients: Users,
  Users: Users,
  Hospitals: Building,
  Departments: Folder,
  Settings: Settings,
};

export default function Sidebar({ open }: SidebarProps) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  if (!user) return null;

  return (
    <aside className={`min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg transition-all duration-300 ${open ? 'w-64 p-4' : 'w-0 p-0 overflow-hidden'}`}>
      {open && (
        <>
          <h2 className="text-lg font-bold mb-6 capitalize">{user.role} Panel</h2>
          <nav className="flex flex-col gap-3">
            {navLinks[user.role].map((link) => {
              const Icon = iconMap[link.label as keyof typeof iconMap];
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'hover:bg-blue-400 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
}
