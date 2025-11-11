// app/admin/hospitals/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface Hospital {
  _id: string;
  name: string;
  address: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export default function ManageHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/hospitals");
      setHospitals(res.data);
    } catch (err) {
      console.error("Error fetching hospitals", err);
    } finally {
      setLoading(false);
    }
  };

  const addHospital = async () => {
    if (!name.trim() || !line1.trim() || !city.trim() || !state.trim() || !pincode.trim()) return;
    try {
      await api.post("/admin/hospitals", { name, address: { line1, city, state, pincode } });
      setName("");
      setLine1("");
      setCity("");
      setState("");
      setPincode("");
      fetchHospitals();
    } catch (err) {
      console.error("Error adding hospital", err);
    }
  };

  const deleteHospital = async (id: string) => {
    try {
      await api.delete(`/admin/hospitals/${id}`);
      fetchHospitals();
    } catch (err) {
      console.error("Error deleting hospital", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Hospitals</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Hospital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Hospital Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Address Line 1"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
          />
          <Input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Input
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
          <Input
            placeholder="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />
          <Button onClick={addHospital}>Add Hospital</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Hospitals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : hospitals.length === 0 ? (
            <p>No hospitals found.</p>
          ) : (
            <table className="w-full text-left border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Address</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((hospital) => (
                  <tr key={hospital._id}>
                    <td className="p-2 border">{hospital.name}</td>
                    <td className="p-2 border">{`${hospital.address.line1}, ${hospital.address.city}, ${hospital.address.state} ${hospital.address.pincode}`}</td>
                    <td className="p-2 border">
                      <Button
                        variant="destructive"
                        onClick={() => deleteHospital(hospital._id)}
                      >
                        Delete
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
