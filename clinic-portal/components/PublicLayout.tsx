"use client";

import { ReactNode } from "react";
import Navbar from "./Navbar";
import Image from "next/image";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="relative min-h-screen">
      {/* Background wallpaper */}
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
      <div className="relative z-10 flex flex-col min-h-screen pt-20">
        {children}
      </div>
    </div>
  );
}
