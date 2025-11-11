import ProtectedRoute from "@/components/ProtectedRoute";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <div className="p-6 bg-gray-100 flex-1">
        {children}
      </div>
    </ProtectedRoute>
  );
}
