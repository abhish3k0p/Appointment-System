"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api"; // axios instance
import { toast } from "react-hot-toast";
import { getAvatarUrl } from "@/lib/utils";
import { User, Lock, Camera } from "lucide-react";
import Image from "next/image";

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}
export default function PatientProfile() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    avatarUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setProfile(res.data);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Update profile
  const handleUpdateProfile = async () => {
    if (!profile.name.trim()) return toast.error("Name is required");

    try {
      setSavingProfile(true);
      await api.patch("/patient/profile", {
        name: profile.name,
        phone: profile.phone,
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.newPassword || !passwords.confirm) {
      return toast.error("All password fields are required");
    }
    if (passwords.newPassword !== passwords.confirm) {
      return toast.error("Passwords don’t match");
    }

    try {
      setChangingPassword(true);
      await api.post("/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.newPassword,
      });
      toast.success("Password changed successfully");
      setPasswords({ current: "", newPassword: "", confirm: "" });
    } catch {
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarFile) return toast.error("Please select an image first");

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const res = await api.post("/patient/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });

      // Append timestamp to bust cache
      setProfile((prev) => ({ ...prev, avatarUrl: `${res.data.avatarUrl}?t=${Date.now()}` }));
      setPreviewUrl(null);
      setAvatarFile(null);

      toast.success("Profile picture updated");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-md mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto bg-white-500">
      <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
      {/* Avatar Upload Section */}
      <div className="bg-gradient-to-r from-orange-300 to-red-400 rounded-xl shadow-lg p-6 border border-blue-300 flex flex-col items-center space-y-4">
        <div className="relative">
          <Image
            src={getAvatarUrl(previewUrl) || getAvatarUrl(profile.avatarUrl)}
            alt="Profile"
            width={128}
            height={128}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <Camera className="absolute bottom-0 right-0 w-8 h-8 text-white bg-blue-700 rounded-full p-1 shadow-lg" />
        </div>
        <label htmlFor="avatar-upload" className="cursor-pointer mt-2 inline-block text-white bg-blue-700 px-4 py-2 rounded-lg shadow hover:bg-blue-800 transition">
          Choose file
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setAvatarFile(e.target.files[0]);
              setPreviewUrl(URL.createObjectURL(e.target.files[0]));
            }
          }}
          className="hidden"
        />
        {previewUrl && (
          <button
            onClick={handleAvatarUpload}
            disabled={uploadingAvatar}
            className="bg-purple-600 text-white px-5 py-2 rounded-lg shadow hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {uploadingAvatar ? "Uploading..." : "Save Profile Picture"}
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="bg-gradient-to-r from-sky-400 to-blue-600 rounded-xl shadow-lg p-6 border border-blue-300 space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <User className="w-5 h-5" /> Personal Info
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block font-medium text-white">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
              className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring focus:ring-blue-300 bg-blue-50 text-gray-900"
            />
          </div>

          <div>
            <label className="block font-medium text-white">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full border border-blue-300 rounded-lg px-3 py-2 bg-blue-100 text-blue-700"
            />
          </div>

          <div>
            <label className="block font-medium text-white">Phone</label>
            <input
              type="text"
              value={profile.phone || ""}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring focus:ring-blue-300 bg-blue-50 text-gray-900"
            />
          </div>
        </div>
        <button
          onClick={handleUpdateProfile}
          disabled={savingProfile}
          className="mt-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white px-5 py-2 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          {savingProfile ? "Updating..." : "Update Profile"}
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-gradient-to-r from-red-400 to-violet-600 rounded-xl shadow-lg p-6 border border-green-300 space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Lock className="w-5 h-5" /> Change Password
        </h2>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Current Password"
            value={passwords.current}
            onChange={(e) =>
              setPasswords({ ...passwords, current: e.target.value })
            }
            className="w-full border border-green-300 rounded-lg px-3 py-2 focus:ring focus:ring-green-300 bg-green-50 text-gray-900"
          />
          <input
            type="password"
            placeholder="New Password"
            value={passwords.newPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, newPassword: e.target.value })
            }
            className="w-full border border-green-300 rounded-lg px-3 py-2 focus:ring focus:ring-green-300 bg-green-50 text-gray-900"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={passwords.confirm}
            onChange={(e) =>
              setPasswords({ ...passwords, confirm: e.target.value })
            }
            className="w-full border border-green-300 rounded-lg px-3 py-2 focus:ring focus:ring-green-300 bg-green-50 text-gray-900"
          />
        </div>
        <button
          onClick={handleChangePassword}
          disabled={changingPassword}
          className="mt-3 bg-gradient-to-r from-green-600 to-green-800 text-white px-5 py-2 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          {changingPassword ? "Changing..." : "Change Password"}
        </button>
      </div>
    </div >
  );
}
