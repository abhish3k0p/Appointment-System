// app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface HospitalGroup {
  hospital: {
    _id: string;
    name: string;
  };
  users: User[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  active: boolean;
  phone?: string;
  address: string | { line1: string; city: string; state: string; pincode: string };
  createdAt: string;
}

export default function ManageUsersPage() {
  const [hospitalGroups, setHospitalGroups] = useState<HospitalGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setHospitalGroups(res.data);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, active: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}`, { active: !active });
      fetchUsers();
    } catch (err) {
      console.error("Error updating user", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : hospitalGroups.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <div className="space-y-6">
              {hospitalGroups.map((group) => (
                <div key={group.hospital._id}>
                  <h2 className="text-xl font-semibold mb-4">{group.hospital.name}</h2>
                  <table className="w-full text-left border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border">Name</th>
                        <th className="p-2 border">Email</th>
                        <th className="p-2 border">Role</th>
                        <th className="p-2 border">Status</th>
                        <th className="p-2 border">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.users.map((user) => (
                        <tr key={user._id}>
                          <td className="p-2 border">{user.name}</td>
                          <td className="p-2 border">{user.email}</td>
                          <td className="p-2 border capitalize">{user.role}</td>
                          <td className="p-2 border">
                            <Button
                              variant={user.active ? "default" : "secondary"}
                              onClick={() =>
                                toggleUserStatus(user._id, user.active)
                              }
                            >
                              {user.active ? "Available" : "Unavailable"}
                            </Button>
                          </td>
                          <td className="p-2 border">
                            <Button
                              variant={user.active ? "destructive" : "default"}
                              onClick={() =>
                                toggleUserStatus(user._id, user.active)
                              }
                            >
                              {user.active ? "Deactivate" : "Activate"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
