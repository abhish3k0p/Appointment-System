"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import DoctorCard from "@/components/DoctorCard";
import { AxiosError } from "axios";


interface Hospital {
  _id: string;
  name: string;
  departments: { _id: string; name: string }[];
}

interface Doctor {
  _id: string;
  name: string;
  image?: string;
  speciality?: string;
  degree?: string;
  experience?: string;
  fees?: number;
  rating?: number;
}

interface Slot {
  startTime: string;
  endTime: string;
}

type Step = "choose" | "slot" | "payment";

export default function BookAppointmentPage() {
  const [step, setStep] = useState<Step>("choose");

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedSpeciality, setSelectedSpeciality] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState("");

  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // ✅ Fetch hospitals on load
  useEffect(() => {
    api
      .get("/patient/hospitals")
      .then((res) => setHospitals(res.data))
      .catch(() => toast.error("Failed to load hospitals"));
  }, []);



  // ✅ Reset speciality + doctors when hospital changes
  useEffect(() => {
    if (selectedHospital) {
      // Use already fetched hospitals data to get departments
      const hospital = hospitals.find((h) => h._id === selectedHospital);
      setSpecialities(hospital?.departments.map(d => d.name) || []);
      setSelectedSpeciality("");
      setDoctors([]);
      setSelectedDoctor(null);
      setSlots([]);
      setStep("choose");
    }
  }, [selectedHospital, hospitals]);

  // ✅ Fetch doctors when speciality selected
  useEffect(() => {
    if (selectedHospital && selectedSpeciality) {
      setLoadingDoctors(true);
      api
        .get(
          `/patient/doctor/search?hospitalId=${selectedHospital}&speciality=${selectedSpeciality}`
        )
        .then((res) => {
          console.log("Availability API response:", res.data);
          const result = Array.isArray(res.data.items) ? res.data.items : [];
          setDoctors(result);
        })
        .catch(() => toast.error("Failed to load doctors"))
        .finally(() => setLoadingDoctors(false));

      setSelectedDoctor(null);
      setSlots([]);
      setStep("choose");
    }
  }, [selectedHospital, selectedSpeciality]);

  // ✅ Fetch slots when doctor selected
  useEffect(() => {
    if (selectedDoctor?._id) {
      const today = new Date().toISOString().split("T")[0];
      api
        .get(`/doctor/${selectedDoctor._id}/availability?date=${today}`)
        .then((res) => {
          const av = Array.isArray(res.data) ? res.data[0] : res.data;
          setSlots(av?.slots || []);
        })
        .catch(() => toast.error("Failed to load slots"));

      setSelectedSlot(null);
      setStep("slot");
    }
  }, [selectedDoctor]);

  const handleBook = async () => {
  if (!selectedDoctor || !selectedSlot) {
    toast.error("Please select a doctor and a slot");
    return;
  }

  try {
    // 1. Create appointment
    const { data: appointment } = await api.post("/appointments/book", {
      profileId: selectedDoctor._id,
      startTime: new Date(selectedSlot.startTime).toISOString(),
      endTime: new Date(selectedSlot.endTime).toISOString(),
      reason: reason.trim(),
    });

    // Store appointment ID for success page
    localStorage.setItem('pendingAppointmentId', appointment._id);

    // 2. Create Stripe Checkout session (no amount here!)
    const { data } = await api.post("/payments/create-checkout-session", {
      appointmentId: appointment._id,
    });

    // 3. Redirect to Stripe
    window.location.href = data.url;
      } catch (err) {
    let message = "Booking failed";
    if (err instanceof AxiosError && err.response?.data?.message) {
      message = err.response.data.message;
    }
    toast.error(message);
    localStorage.removeItem('pendingAppointmentId');
  }
};

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold mb-6">Book Appointment</h1>

      {/* Step 1: Hospital & Speciality & Doctor */}
      {step === "choose" && (
        <>
          {/* Hospital */}
          <div>
            <label className="block mb-2 font-medium">Hospital</label>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">-- Choose Hospital --</option>
              {hospitals.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Speciality */}
          {specialities.length > 0 && (
            <div>
              <label className="block mb-2 font-medium">Speciality</label>
              <select
                value={selectedSpeciality}
                onChange={(e) => setSelectedSpeciality(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="">-- Choose Speciality --</option>
                {specialities.map((s, index) => (
                  <option key={index} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Doctors */}
          {selectedSpeciality && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Available Doctors</h2>
              {loadingDoctors && (
                <p className="text-center text-gray-500 py-16">
                  Loading doctors...
                </p>
              )}
              {!loadingDoctors && doctors.length === 0 && (
                <div className="text-center py-16">
                  <h2 className="text-2xl font-semibold text-gray-700">
                    No Doctors Available
                  </h2>
                  <p className="mt-2 text-gray-500">
                    Please try another speciality or check back later.
                  </p>
                </div>
              )}
              {!loadingDoctors && doctors.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 mb-10">
                  {doctors.map((doc) => (
                    <DoctorCard
                      key={doc._id}
                      _id={doc._id}
                      name={doc.name || "Unnamed Doctor"}
                      image={doc.image || "/default-doctor.png"}
                      speciality={doc.speciality || "General"}
                      degree={doc.degree || ""}
                      experience={doc.experience || "N/A"}
                      fees={doc.fees || 0}
                      rating={doc.rating || 0}
                      onSelectDoctor={() => setSelectedDoctor(doc)} // ✅ FIXED
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Step 2: Slot chooser */}
      {step === "slot" && selectedDoctor && (
        <div>
          <button
            onClick={() => setStep("choose")}
            className="mb-4 text-blue-600"
          >
            ← Back
          </button>
          <h2 className="text-xl font-semibold mb-4">
            Available Slots for {selectedDoctor.name}
          </h2>
          {slots.length === 0 ? (
            <p>No slots available</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {slots.map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2 border rounded ${selectedSlot?.startTime === slot.startTime
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100"
                    }`}
                >
                  {new Date(slot.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(slot.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </button>
              ))}
            </div>
          )}

          {selectedSlot && (
            <div>
              <label className="block mb-2 font-medium">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border rounded p-2 mb-4"
              />
              <button
                onClick={handleBook}
                className="w-full bg-green-600 text-white py-2 rounded"
              >
                Confirm & Pay
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Payment (loading state) */}
      {step === "payment" && (
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold mb-2">Redirecting to Payment...</h2>
          <p>Please wait while we process your request.</p>
        </div>
      )}


    </div>
  );
}