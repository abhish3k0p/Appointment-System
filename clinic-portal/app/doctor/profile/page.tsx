"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Address {
    line1: string;
}

interface DoctorProfile {
    _id: string;
    userId: string;
    name: string;
    email: string;
    image?: string;
    speciality: string;
    degree: string;
    experience: string;
    about: string;
    fees: number;
    available: boolean;
    address: Address;
}

export default function DoctorProfilePage() {
    const [profile, setProfile] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Fetch doctor profile
    const fetchProfile = async () => {
        try {
            const res = await api.get("/doctor/profile");
            setProfile(res.data);
        } catch {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Update doctor profile
    const handleUpdateProfile = async () => {
        if (!profile) return;

        try {
            setUpdating(true);
            const res = await api.patch("/doctor/profile", profile);
            setProfile(res.data);
            toast.success("Profile updated successfully");
        } catch {
            toast.error("Failed to update profile");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <p>Loading profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <p className="text-red-500">No profile found</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-xl">
                    <CardTitle className="text-white">Doctor Profile</CardTitle>
                    <div className="flex items-center space-x-4">
                        <Image
                            src={profile.image || "/default-doctor.png"}
                            alt="Avatar"
                            width={96}
                            height={96}
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                        />
                        <div className="space-y-1 text-white">
                            <p className="text-xl font-bold">{profile.name}</p>
                            <p className="text-blue-100">{profile.email}</p>
                            <p className="text-sm font-medium">{profile.speciality}</p>
                            <p className="text-sm">Degree: {profile.degree}</p>
                            <p className="text-sm">Experience: {profile.experience}</p>
                            <p className="text-sm">Fees: ₹{profile.fees}</p>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${profile.available ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}`}>
                                {profile.available ? "Available" : "Unavailable"}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">About</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            rows={4}
                            value={profile.about}
                            onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                        />
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Address Line 1</label>
                        <input
                            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            value={profile.address?.line1 || ""}
                            onChange={(e) =>
                                setProfile({
                                    ...profile,
                                    address: {
                                        ...profile.address,
                                        line1: e.target.value,
                                    },
                                })
                            }
                        />
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Availability</label>
                    <div className="flex items-center space-x-2">
                        {/* Removed availability checkbox as availability is controlled by admin */}
                        <span className="text-sm text-gray-700 italic">Availability is managed by the admin.</span>
                    </div>
                </div>
                </CardContent>
                <CardFooter className="bg-gray-50 rounded-b-xl">
                    <Button onClick={handleUpdateProfile} disabled={updating} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {updating ? "Updating..." : "Update Profile"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
