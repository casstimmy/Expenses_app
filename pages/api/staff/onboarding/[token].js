import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";

const EMPTY_ONBOARDING_DATA = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  dateOfBirth: "",
  stateOfOrigin: "",
  nextOfKin: "",
  nextOfKinPhone: "",
  photo: "",
};

const EMPTY_GUARANTOR = {
  name: "",
  phone: "",
  email: "",
  address: "",
  relationship: "",
  occupation: "",
  photo: "",
};

function normalizeOnboardingData(data = {}) {
  return {
    fullName: data.fullName?.trim() || "",
    email: data.email?.trim() || "",
    phone: data.phone?.trim() || "",
    address: data.address?.trim() || "",
    dateOfBirth: data.dateOfBirth || "",
    stateOfOrigin: data.stateOfOrigin?.trim() || "",
    nextOfKin: data.nextOfKin?.trim() || "",
    nextOfKinPhone: data.nextOfKinPhone?.trim() || "",
    photo: data.photo || "",
  };
}

function normalizeGuarantor(data = {}) {
  return {
    name: data.name?.trim() || "",
    phone: data.phone?.trim() || "",
    email: data.email?.trim() || "",
    address: data.address?.trim() || "",
    relationship: data.relationship?.trim() || "",
    occupation: data.occupation?.trim() || "",
    photo: data.photo || "",
  };
}

function hasAnyData(data = {}) {
  return Object.values(data).some((value) =>
    typeof value === "string" ? value.trim() !== "" : Boolean(value)
  );
}

function isPersonalSectionComplete(data = {}) {
  return Boolean(data.fullName?.trim() && data.phone?.trim());
}

function isGuarantorSectionComplete(data = {}) {
  return Boolean(data.name?.trim() && data.phone?.trim());
}

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  await mongooseConnect();

  // GET — fetch staff info for the form
  if (req.method === "GET") {
    try {
      const staff = await Staff.findOne({ onboardingToken: token }).select(
        "name location role onboardingComplete onboardingData guarantor photo"
      );

      if (!staff) {
        return res.status(404).json({ message: "Invalid or expired link" });
      }

      const onboardingData = normalizeOnboardingData(staff.onboardingData || EMPTY_ONBOARDING_DATA);
      const guarantor = normalizeGuarantor(staff.guarantor || EMPTY_GUARANTOR);

      return res.status(200).json({
        name: staff.name,
        location: staff.location,
        role: staff.role,
        onboardingComplete: staff.onboardingComplete,
        onboardingData,
        guarantor,
        personalSectionComplete: isPersonalSectionComplete(onboardingData),
        guarantorSectionComplete: isGuarantorSectionComplete(guarantor),
        photo: staff.photo || "",
      });
    } catch (err) {
      console.error("Onboarding GET error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  // POST — submit the onboarding form
  if (req.method === "POST") {
    try {
      const staff = await Staff.findOne({ onboardingToken: token });

      if (!staff) {
        return res.status(404).json({ message: "Invalid or expired link" });
      }

      const { onboardingData, guarantor } = req.body;

      const nextOnboardingData = onboardingData
        ? normalizeOnboardingData(onboardingData)
        : normalizeOnboardingData(staff.onboardingData || EMPTY_ONBOARDING_DATA);
      const nextGuarantor = guarantor
        ? normalizeGuarantor(guarantor)
        : normalizeGuarantor(staff.guarantor || EMPTY_GUARANTOR);

      if (!hasAnyData(nextOnboardingData) && !hasAnyData(nextGuarantor)) {
        return res.status(400).json({
          message: "Add at least one staff or guarantor detail before saving.",
        });
      }

      staff.onboardingData = nextOnboardingData;
      staff.guarantor = nextGuarantor;

      // If staff passport photo was uploaded via onboarding, also set the main photo
      if (nextOnboardingData.photo) {
        staff.photo = nextOnboardingData.photo;
      }

      const personalSectionComplete = isPersonalSectionComplete(nextOnboardingData);
      const guarantorSectionComplete = isGuarantorSectionComplete(nextGuarantor);

      staff.onboardingComplete = personalSectionComplete && guarantorSectionComplete;
      await staff.save();

      return res.status(200).json({
        message: staff.onboardingComplete
          ? "Onboarding form completed successfully!"
          : "Progress saved. Staff and guarantor details can be completed later.",
        onboardingComplete: staff.onboardingComplete,
        onboardingData: nextOnboardingData,
        guarantor: nextGuarantor,
        personalSectionComplete,
        guarantorSectionComplete,
      });
    } catch (err) {
      console.error("Onboarding POST error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
