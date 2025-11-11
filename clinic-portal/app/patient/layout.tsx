import ProtectedRoute from "@/components/ProtectedRoute";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="p-6">
        {children}
      </div>
    </ProtectedRoute>
  );
}
