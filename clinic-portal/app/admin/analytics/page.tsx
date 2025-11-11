"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import api from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  doctors: number;
  patients: number;
  appointments: number;
  hospitals: number;
  bookingsByHospital: { hospital: string; count: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/admin/analytics");
      setData(res.data);
    } catch (err) {
      console.error("Error fetching analytics", err);
    }
  };

  if (!data) return <p className="p-6">Loading analytics...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">System Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.doctors}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.patients}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.appointments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Hospitals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.hospitals}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings by Hospital Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings by Hospital</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.bookingsByHospital}>
              <XAxis dataKey="hospital" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
