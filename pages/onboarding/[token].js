import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Camera, CheckCircle, Loader2 } from "lucide-react";

export default function StaffOnboarding() {
  const router = useRouter();
  const { token } = router.query;

  const [staffInfo, setStaffInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [staffPhotoPreview, setStaffPhotoPreview] = useState(null);
  const [staffPhotoUrl, setStaffPhotoUrl] = useState("");
  const [uploadingStaffPhoto, setUploadingStaffPhoto] = useState(false);

  const [guarantorPhotoPreview, setGuarantorPhotoPreview] = useState(null);
  const [guarantorPhotoUrl, setGuarantorPhotoUrl] = useState("");
  const [uploadingGuarantorPhoto, setUploadingGuarantorPhoto] = useState(false);

  const staffPhotoRef = useRef(null);
  const guarantorPhotoRef = useRef(null);

  const [personalForm, setPersonalForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    stateOfOrigin: "",
    nextOfKin: "",
    nextOfKinPhone: "",
  });

  const [guarantorForm, setGuarantorForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    relationship: "",
    occupation: "",
  });

  useEffect(() => {
    if (!token) return;
    fetchStaffInfo();
  }, [token]);

  const fetchStaffInfo = async () => {
    try {
      const res = await fetch(`/api/staff/onboarding/${token}`);
      if (res.ok) {
        const data = await res.json();
        setStaffInfo(data);

        // Pre-fill if already submitted
        if (data.onboardingComplete && data.onboardingData) {
          setPersonalForm({
            fullName: data.onboardingData.fullName || "",
            email: data.onboardingData.email || "",
            phone: data.onboardingData.phone || "",
            address: data.onboardingData.address || "",
            dateOfBirth: data.onboardingData.dateOfBirth || "",
            stateOfOrigin: data.onboardingData.stateOfOrigin || "",
            nextOfKin: data.onboardingData.nextOfKin || "",
            nextOfKinPhone: data.onboardingData.nextOfKinPhone || "",
          });
          if (data.onboardingData.photo) {
            setStaffPhotoPreview(data.onboardingData.photo);
            setStaffPhotoUrl(data.onboardingData.photo);
          }
        }
        if (data.onboardingComplete && data.guarantor) {
          setGuarantorForm({
            name: data.guarantor.name || "",
            phone: data.guarantor.phone || "",
            email: data.guarantor.email || "",
            address: data.guarantor.address || "",
            relationship: data.guarantor.relationship || "",
            occupation: data.guarantor.occupation || "",
          });
          if (data.guarantor.photo) {
            setGuarantorPhotoPreview(data.guarantor.photo);
            setGuarantorPhotoUrl(data.guarantor.photo);
          }
        }
      } else {
        setError("This onboarding link is invalid or has expired.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load onboarding form.");
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("token", token);

    const res = await fetch("/api/staff/onboarding/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.links?.[0] || "";
  };

  const handleStaffPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setStaffPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploadingStaffPhoto(true);
    try {
      const url = await uploadPhoto(file);
      setStaffPhotoUrl(url);
    } catch (err) {
      setError("Failed to upload photo. Please try again.");
    } finally {
      setUploadingStaffPhoto(false);
    }
  };

  const handleGuarantorPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setGuarantorPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploadingGuarantorPhoto(true);
    try {
      const url = await uploadPhoto(file);
      setGuarantorPhotoUrl(url);
    } catch (err) {
      setError("Failed to upload photo. Please try again.");
    } finally {
      setUploadingGuarantorPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!personalForm.fullName || !personalForm.phone) {
      setError("Full name and phone number are required.");
      setSubmitting(false);
      return;
    }

    if (!guarantorForm.name || !guarantorForm.phone) {
      setError("Guarantor name and phone number are required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/staff/onboarding/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingData: { ...personalForm, photo: staffPhotoUrl },
          guarantor: { ...guarantorForm, photo: guarantorPhotoUrl },
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.message || "Submission failed.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !staffInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Link Invalid</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <CheckCircle size={60} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Form Submitted!</h1>
          <p className="text-gray-500">
            Thank you, your details and guarantor information have been submitted successfully.
            Your profile has been updated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Staff Onboarding — BizSuits</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              BizSuits™ Staff Onboarding
            </h1>
            <p className="text-gray-500 mt-1">Welcome, {staffInfo?.name}! Please complete your profile.</p>
            <p className="text-xs text-gray-400 mt-1">📍 {staffInfo?.location} · {staffInfo?.role}</p>
          </div>

          {staffInfo?.onboardingComplete && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-3 mb-4 text-sm text-center">
              You have already submitted this form. You can update your details below.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Personal Details */}
            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-blue-700 mb-4">📋 Personal Details</h2>

              {/* Passport Photo */}
              <div className="flex flex-col items-center mb-5">
                <div
                  onClick={() => staffPhotoRef.current?.click()}
                  className="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition overflow-hidden"
                >
                  {uploadingStaffPhoto ? (
                    <Loader2 size={30} className="text-blue-400 animate-spin" />
                  ) : staffPhotoPreview ? (
                    <img src={staffPhotoPreview} alt="Staff" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={30} className="text-gray-400" />
                  )}
                </div>
                <input ref={staffPhotoRef} type="file" accept="image/*" capture="user" onChange={handleStaffPhoto} className="hidden" />
                <p className="text-xs text-gray-400 mt-2">Tap to upload passport photo</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={personalForm.fullName}
                  onChange={(e) => setPersonalForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={personalForm.email}
                  onChange={(e) => setPersonalForm((p) => ({ ...p, email: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm((p) => ({ ...p, phone: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                  required
                />
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={personalForm.dateOfBirth}
                  onChange={(e) => setPersonalForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="State of Origin"
                  value={personalForm.stateOfOrigin}
                  onChange={(e) => setPersonalForm((p) => ({ ...p, stateOfOrigin: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="Home Address"
                  value={personalForm.address}
                  onChange={(e) => setPersonalForm((p) => ({ ...p, address: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full sm:col-span-2"
                />
                <input
                  type="text"
                  placeholder="Next of Kin Name"
                  value={personalForm.nextOfKin}
                  onChange={(e) => setPersonalForm((p) => ({ ...p, nextOfKin: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="tel"
                  placeholder="Next of Kin Phone"
                  value={personalForm.nextOfKinPhone}
                  onChange={(e) => setPersonalForm((p) => ({ ...p, nextOfKinPhone: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                />
              </div>
            </div>

            {/* Section 2: Guarantor Details */}
            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-blue-700 mb-4">🤝 Guarantor Details</h2>

              {/* Guarantor Photo */}
              <div className="flex flex-col items-center mb-5">
                <div
                  onClick={() => guarantorPhotoRef.current?.click()}
                  className="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition overflow-hidden"
                >
                  {uploadingGuarantorPhoto ? (
                    <Loader2 size={30} className="text-blue-400 animate-spin" />
                  ) : guarantorPhotoPreview ? (
                    <img src={guarantorPhotoPreview} alt="Guarantor" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={30} className="text-gray-400" />
                  )}
                </div>
                <input ref={guarantorPhotoRef} type="file" accept="image/*" capture="user" onChange={handleGuarantorPhoto} className="hidden" />
                <p className="text-xs text-gray-400 mt-2">Tap to upload guarantor passport photo</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Guarantor Full Name *"
                  value={guarantorForm.name}
                  onChange={(e) => setGuarantorForm((p) => ({ ...p, name: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                  required
                />
                <input
                  type="tel"
                  placeholder="Guarantor Phone *"
                  value={guarantorForm.phone}
                  onChange={(e) => setGuarantorForm((p) => ({ ...p, phone: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                  required
                />
                <input
                  type="email"
                  placeholder="Guarantor Email"
                  value={guarantorForm.email}
                  onChange={(e) => setGuarantorForm((p) => ({ ...p, email: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="Relationship (e.g. Parent, Sibling)"
                  value={guarantorForm.relationship}
                  onChange={(e) => setGuarantorForm((p) => ({ ...p, relationship: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="Guarantor Occupation"
                  value={guarantorForm.occupation}
                  onChange={(e) => setGuarantorForm((p) => ({ ...p, occupation: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="Guarantor Address"
                  value={guarantorForm.address}
                  onChange={(e) => setGuarantorForm((p) => ({ ...p, address: e.target.value }))}
                  className="border p-2.5 rounded-lg w-full sm:col-span-2"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting || uploadingStaffPhoto || uploadingGuarantorPhoto}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition shadow-lg"
            >
              {submitting ? "Submitting..." : "Submit Onboarding Form"}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            BizSuits™ Expense Management System
          </p>
        </div>
      </div>
    </>
  );
}
