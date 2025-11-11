"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Home, Info, LogIn, UserPlus, Menu } from "lucide-react";

interface NavbarProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const isAuthPage = pathname === '/sign-in' || pathname === '/register';
  const isHome = pathname === '/';
  const isAbout = pathname === '/about';
  const isDashboard = pathname.startsWith('/patient') || pathname.startsWith('/doctor') || pathname.startsWith('/admin');

  const showAuthLinks = !user && !isHome && !isAuthPage;
  const showNavLinks = !isAuthPage && !user;

  const glassyClass = isDashboard ? "bg-gradient-to-r from-blue-50 to-blue-100 shadow-md" : (isHome || isAbout) ? "bg-white/10 backdrop-blur-md border-b border-white/20" : "";
  const textClass = isDashboard ? "text-gray-800" : "text-white";

  const toggleSidebar = () => setSidebarOpen && setSidebarOpen(!sidebarOpen);

  return (
    <nav className={`flex justify-between items-center p-4 ${textClass} ${glassyClass} transition-all duration-300`}>
      <div className="flex items-center">
        {isDashboard && (
          <button onClick={toggleSidebar} className="mr-4 p-2 rounded-lg hover:bg-blue-200 transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        )}
        <Link href="/" className="text-2xl font-bold hover:text-blue-300 transition-colors">Clinic Portal</Link>
      </div>

      <div className="flex gap-6 items-center">
        {showNavLinks && (
          <>
            <Link href="/" className={`flex items-center hover:underline transition-colors ${pathname === '/' ? 'font-bold text-blue-300' : ''}`}>
              <Home className="w-4 h-4 mr-1" /> Home
            </Link>
            <Link href="/about" className={`flex items-center hover:underline transition-colors ${pathname === '/about' ? 'font-bold text-blue-300' : ''}`}>
              <Info className="w-4 h-4 mr-1" /> About
            </Link>
          </>
        )}

        {user ? (
          <>
            {user.role === "patient" && <Link href="/patient" className="hover:underline font-bold transition-colors">Dashboard</Link>}
            {user.role === "doctor" && <Link href="/doctor" className="hover:underline transition-colors">Dashboard</Link>}
            {user.role === "admin" && <Link href="/admin" className="hover:underline transition-colors">Dashboard</Link>}
            {isDashboard && <button onClick={logout} className="py-2 px-4 rounded-xl bg-gradient-to-r from-rose-400 to-red-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">Logout</button>}
          </>
        ) : showAuthLinks ? (
          <>
            <Link href="/sign-in" className={`flex items-center hover:underline transition-colors ${pathname === '/sign-in' ? 'font-bold text-blue-300' : ''}`}>
              <LogIn className="w-4 h-4 mr-1" /> Login
            </Link>
            <Link href="/register" className={`flex items-center hover:underline transition-colors ${pathname === '/register' ? 'font-bold text-blue-300' : ''}`}>
              <UserPlus className="w-4 h-4 mr-1" /> Register
            </Link>
          </>
        ) : null}
      </div>
    </nav>
  );
}
