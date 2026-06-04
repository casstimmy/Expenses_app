import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Camera, CheckCircle, Loader2 } from "lucide-react";

const EMPTY_MODAL = {
  open: false,
  title: "",
  message: "",
};

const EMPTY_PERSONAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  dateOfBirth: "",
  stateOfOrigin: "",
  nextOfKin: "",
  nextOfKinPhone: "",
};

const EMPTY_GUARANTOR_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  relationship: "",
  occupation: "",
};

function hasAnyData(values = {}, photo = "") {
  return [...Object.values(values), photo].some((value) =>
    typeof value === "string" ? value.trim() !== "" : Boolean(value)
  );
}

function isPersonalSectionComplete(values = {}) {
  return Boolean(values.fullName?.trim() && values.phone?.trim());
}

function isGuarantorSectionComplete(values = {}) {
  return Boolean(values.name?.trim() && values.phone?.trim());
}

export default function StaffOnboarding() {
  const router = useRouter();
  const { token } = router.query;

  const [staffInfo, setStaffInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmationModal, setConfirmationModal] = useState(EMPTY_MODAL);

  const [staffPhotoPreview, setStaffPhotoPreview] = useState(null);
  const [staffPhotoUrl, setStaffPhotoUrl] = useState("");
  const [uploadingStaffPhoto, setUploadingStaffPhoto] = useState(false);

  const [guarantorPhotoPreview, setGuarantorPhotoPreview] = useState(null);
  const [guarantorPhotoUrl, setGuarantorPhotoUrl] = useState("");
  const [uploadingGuarantorPhoto, setUploadingGuarantorPhoto] = useState(false);

  const [personalForm, setPersonalForm] = useState(EMPTY_PERSONAL_FORM);
  const [guarantorForm, setGuarantorForm] = useState(EMPTY_GUARANTOR_FORM);

  const staffPhotoRef = useRef(null);
  const guarantorPhotoRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadStaffInfo = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/staff/onboarding/${token}`);
        const data = await res.json();

        if (!res.ok) {
          if (!cancelled) {
            setError(data.message || "This onboarding link is invalid or has expired.");
          }
          return;
        }

        if (cancelled) return;

        setStaffInfo(data);

        if (data.onboardingData) {
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
          setStaffPhotoPreview(data.onboardingData.photo || null);
          setStaffPhotoUrl(data.onboardingData.photo || "");
        } else {
          setPersonalForm({ ...EMPTY_PERSONAL_FORM });
          setStaffPhotoPreview(null);
          setStaffPhotoUrl("");
        }

        if (data.guarantor) {
          setGuarantorForm({
            name: data.guarantor.name || "",
            phone: data.guarantor.phone || "",
            email: data.guarantor.email || "",
            address: data.guarantor.address || "",
            relationship: data.guarantor.relationship || "",
            occupation: data.guarantor.occupation || "",
          });
          setGuarantorPhotoPreview(data.guarantor.photo || null);
          setGuarantorPhotoUrl(data.guarantor.photo || "");
        } else {
          setGuarantorForm({ ...EMPTY_GUARANTOR_FORM });
          setGuarantorPhotoPreview(null);
          setGuarantorPhotoUrl("");
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Failed to load onboarding form.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStaffInfo();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const closeConfirmationModal = () => {
    setConfirmationModal(EMPTY_MODAL);
  };

  const uploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("token", token);

    const res = await fetch("/api/staff/onboarding/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    const data = await res.json();
    return data.links?.[0] || "";
  };

  const handleStaffPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => setStaffPhotoPreview(loadEvent.target.result);
    reader.readAsDataURL(file);

    setUploadingStaffPhoto(true);
    try {
      const url = await uploadPhoto(file);
      setStaffPhotoUrl(url);
    } catch (err) {
      console.error(err);
      setError("Failed to upload photo. Please try again.");
    } finally {
      setUploadingStaffPhoto(false);
    }
  };

  const handleGuarantorPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => setGuarantorPhotoPreview(loadEvent.target.result);
    reader.readAsDataURL(file);

    setUploadingGuarantorPhoto(true);
    try {
      const url = await uploadPhoto(file);
      setGuarantorPhotoUrl(url);
    } catch (err) {
      console.error(err);
      setError("Failed to upload photo. Please try again.");
    } finally {
      setUploadingGuarantorPhoto(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const wasAlreadySubmitted = Boolean(staffInfo?.onboardingComplete);
    const onboardingPayload = { ...personalForm, photo: staffPhotoUrl };
    const guarantorPayload = { ...guarantorForm, photo: guarantorPhotoUrl };
    const hasPersonalData = hasAnyData(personalForm, staffPhotoUrl);
    const hasGuarantorData = hasAnyData(guarantorForm, guarantorPhotoUrl);

    if (!hasPersonalData && !hasGuarantorData) {
      setError("Add at least one staff or guarantor detail before saving.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/staff/onboarding/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingData: onboardingPayload,
          guarantor: guarantorPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Submission failed.");
        return;
      }

      setStaffInfo((prev) =>
        prev
          ? {
              ...prev,
              onboardingComplete: Boolean(data.onboardingComplete),
              onboardingData: data.onboardingData || onboardingPayload,
              guarantor: data.guarantor || guarantorPayload,
            }
          : prev
      );

      setConfirmationModal({
        open: true,
        title: data.onboardingComplete
          ? wasAlreadySubmitted
            ? "Profile Updated"
            : "Thank You"
          : "Progress Saved",
        message: data.onboardingComplete
          ? wasAlreadySubmitted
            ? data.message || "Your profile changes have been saved successfully."
            : data.message || "Your profile has been completed successfully."
          : data.message || "Your progress has been saved. The remaining section can be completed later.",
      });
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
          <div className="text-5xl mb-4">Link</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Link Invalid</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const personalSectionComplete = isPersonalSectionComplete(personalForm);
  const guarantorSectionComplete = isGuarantorSectionComplete(guarantorForm);
  const hasSavedProgress =
    hasAnyData(personalForm, staffPhotoUrl) || hasAnyData(guarantorForm, guarantorPhotoUrl);

  return (
    <>
      <Head>
        <title>Staff Onboarding - BizSuits</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              BizSuits Staff Onboarding
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome, {staffInfo?.name}! Staff and guarantor details can be saved separately and completed later.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {staffInfo?.location} - {staffInfo?.role}
            </p>
          </div>

          {staffInfo?.onboardingComplete && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-3 mb-4 text-sm text-center">
              You have already submitted this form. You can update your details below.
            </div>
          )}

          {!staffInfo?.onboardingComplete && hasSavedProgress && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-3 mb-4 text-sm text-center">
              Progress has been saved. The remaining section can be completed later using this same link.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-blue-700">Personal Details</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    personalSectionComplete
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {personalSectionComplete ? "Completed" : "Can be saved later"}
                </span>
              </div>

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
                <input
                  ref={staffPhotoRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleStaffPhoto}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-2">Tap to upload passport photo</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={personalForm.fullName}
                  onChange={(event) =>
                    setPersonalForm((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={personalForm.email}
                  onChange={(event) =>
                    setPersonalForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={personalForm.phone}
                  onChange={(event) =>
                    setPersonalForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="date"
                  value={personalForm.dateOfBirth}
                  onChange={(event) =>
                    setPersonalForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="State of Origin"
                  value={personalForm.stateOfOrigin}
                  onChange={(event) =>
                    setPersonalForm((prev) => ({ ...prev, stateOfOrigin: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="Home Address"
                  value={personalForm.address}
                  onChange={(event) =>
                    setPersonalForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full sm:col-span-2"
                />
                <input
                  type="text"
                  placeholder="Next of Kin Name"
                  value={personalForm.nextOfKin}
                  onChange={(event) =>
                    setPersonalForm((prev) => ({ ...prev, nextOfKin: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="tel"
                  placeholder="Next of Kin Phone"
                  value={personalForm.nextOfKinPhone}
                  onChange={(event) =>
                    setPersonalForm((prev) => ({ ...prev, nextOfKinPhone: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-blue-700">Guarantor Details</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    guarantorSectionComplete
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {guarantorSectionComplete ? "Completed" : "Can be saved later"}
                </span>
              </div>

              <div className="flex flex-col items-center mb-5">
                <div
                  onClick={() => guarantorPhotoRef.current?.click()}
                  className="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition overflow-hidden"
                >
                  {uploadingGuarantorPhoto ? (
                    <Loader2 size={30} className="text-blue-400 animate-spin" />
                  ) : guarantorPhotoPreview ? (
                    <img
                      src={guarantorPhotoPreview}
                      alt="Guarantor"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera size={30} className="text-gray-400" />
                  )}
                </div>
                <input
                  ref={guarantorPhotoRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleGuarantorPhoto}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-2">Tap to upload guarantor passport photo</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Guarantor Full Name"
                  value={guarantorForm.name}
                  onChange={(event) =>
                    setGuarantorForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="tel"
                  placeholder="Guarantor Phone"
                  value={guarantorForm.phone}
                  onChange={(event) =>
                    setGuarantorForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="email"
                  placeholder="Guarantor Email"
                  value={guarantorForm.email}
                  onChange={(event) =>
                    setGuarantorForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="Relationship"
                  value={guarantorForm.relationship}
                  onChange={(event) =>
                    setGuarantorForm((prev) => ({ ...prev, relationship: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="Guarantor Occupation"
                  value={guarantorForm.occupation}
                  onChange={(event) =>
                    setGuarantorForm((prev) => ({ ...prev, occupation: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="Guarantor Address"
                  value={guarantorForm.address}
                  onChange={(event) =>
                    setGuarantorForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                  className="border p-2.5 rounded-lg w-full sm:col-span-2"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || uploadingStaffPhoto || uploadingGuarantorPhoto}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition shadow-lg"
            >
              {submitting
                ? "Saving..."
                : staffInfo?.onboardingComplete
                  ? "Save Profile Changes"
                  : "Save Progress"}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            BizSuits Expense Management System
          </p>
        </div>

        {confirmationModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4 py-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <CheckCircle size={56} className="mx-auto mb-4 text-green-500" />
              <h2 className="text-center text-2xl font-bold text-slate-900">
                {confirmationModal.title}
              </h2>
              <p className="mt-3 text-center text-sm leading-6 text-slate-600">
                {confirmationModal.message}
              </p>
              <button
                type="button"
                onClick={closeConfirmationModal}
                className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Okay
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}