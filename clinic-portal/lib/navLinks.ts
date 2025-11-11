// lib/navLinks.ts
export const navLinks = {
  patient: [
    { href: "/patient", label: "Dashboard" },
    { href: "/patient/appointments", label: "Appointments" },
    { href: "/patient/notes", label: "Prescriptions" },
    { href: "/patient/profile", label: "Profile" },
  ],
  doctor: [
    { href: "/doctor", label: "Dashboard" },
    { href: "/doctor/appointments", label: "Appointments" },
    { href: "/doctor/patients", label: "Patients" },
    { href: "/doctor/notes", label: "Prescription" },
    { href: "/doctor/profile", label: "Profile" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/hospitals", label: "Hospitals" },
    { href: "/admin/departments", label: "Departments" },
    { href: "/admin/settings", label: "Settings" },
  ],
};
