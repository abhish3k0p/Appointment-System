// app/admin/departments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface Hospital {
  _id: string;
  name: string;
}

interface Department {
  _id: string;
  name: string;
  hospitalId: string;
}

export default function ManageDepartmentsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [name, setName] = useState("");

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) fetchDepartments();
  }, [selectedHospital]);

  const fetchHospitals = async () => {
    try {
      const res = await api.get("/admin/hospitals");
      setHospitals(res.data);
      if (res.data.length > 0) {
        setSelectedHospital(res.data[0]._id);
      }
    } catch (err) {
      console.error("Error fetching hospitals", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/departments`);
      setDepartments(res.data);
    } catch (err) {
      console.error("Error fetching departments", err);
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async () => {
    if (!name.trim() || !selectedHospital) return;
    try {
      await api.post(`/admin/hospitals/${selectedHospital}/departments`, { name });
      setName("");
      fetchDepartments();
    } catch (err) {
      console.error("Error adding department", err);
    }
  };

  const deleteDepartment = async (id: string) => {
    if (confirm("Are you sure you want to remove this department?")) {
      try {
        await api.delete(`/admin/departments/${id}`);
        fetchDepartments();
      } catch (err) {
        console.error("Error deleting department", err);
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Departments</h1>

      {/* Hospital Selector */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Select Hospital</label>
        <select
          className="border p-2 rounded w-full"
          value={selectedHospital}
          onChange={(e) => setSelectedHospital(e.target.value)}
        >
          {hospitals.map((h) => (
            <option key={h._id} value={h._id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add Department */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Department</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Department Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={addDepartment}>Add Department</Button>
        </CardContent>
      </Card>

      {/* Department List */}
      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : departments.length === 0 ? (
            <p>No departments found for this hospital.</p>
          ) : (
            <table className="w-full text-left border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept._id}>
                    <td className="p-2 border">{dept.name}</td>
                    <td className="p-2 border">
                      <Button
                        variant="destructive"
                        className="bg-red-500 text-white hover:bg-red-700 hover:text-black focus-visible:ring-2 focus-visible:ring-red-600 outline-none"
                        aria-label="Remove department"
                        onClick={() => deleteDepartment(dept._id)}
                      >
                        Remove
                      </Button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
