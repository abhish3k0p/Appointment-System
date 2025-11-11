"use client";

import "../global.css"; // global styles
import { ReactNode, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar"; // ✅ import Navbar
import Sidebar from "@/components/Sidebar"; // ✅ import Sidebar
import Image from "next/image";

export default function RootLayout({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isDashboard = pathname.startsWith('/patient') || pathname.startsWith('/doctor') || pathname.startsWith('/admin');

  if (user && isDashboard) {
    // For logged-in users on dashboard, show sidebar and navbar
    return (
      <html lang="en">
        <body>
          <div className="min-h-screen flex">
            <Sidebar open={sidebarOpen} />
            <div className="flex-1 flex flex-col">
              <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              {children}
            </div>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: "#333", color: "#fff" },
            }}
          />
        </body>
      </html>
    );
  } else if (user) {
    // For logged-in users not on dashboard, no sidebar or navbar
    return (
      <html lang="en">
        <body>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: "#333", color: "#fff" },
            }}
          />
        </body>
      </html>
    );
  }

  // For public pages, show background and navbar
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/default-doctor.png" />
        <link rel="preload" href="/landing.png" as="image" />
      </head>
      <body>
        {/* Background wallpaper */}
        <div className="relative min-h-screen">
          <Image
            src="/landing.png"
            alt="Background"
            fill
            className="object-cover -z-10"
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/30 -z-10" />

          {/* Navbar */}
          <Navbar />

          {/* Page content */}
          <div className="flex flex-col">{children}</div>
        </div>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: "#333", color: "#fff" },
          }}
        />
      </body>
    </html>
  );
}
