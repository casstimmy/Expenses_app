import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";

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

      return res.status(200).json({
        name: staff.name,
        location: staff.location,
        role: staff.role,
        onboardingComplete: staff.onboardingComplete,
        onboardingData: staff.onboardingData || {},
        guarantor: staff.guarantor || {},
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

      if (!onboardingData || !guarantor) {
        return res
          .status(400)
          .json({ message: "Both personal details and guarantor info are required." });
      }

      // Save onboarding data
      staff.onboardingData = {
        fullName: onboardingData.fullName?.trim() || "",
        email: onboardingData.email?.trim() || "",
        phone: onboardingData.phone?.trim() || "",
        address: onboardingData.address?.trim() || "",
        dateOfBirth: onboardingData.dateOfBirth || "",
        stateOfOrigin: onboardingData.stateOfOrigin?.trim() || "",
        nextOfKin: onboardingData.nextOfKin?.trim() || "",
        nextOfKinPhone: onboardingData.nextOfKinPhone?.trim() || "",
        photo: onboardingData.photo || "",
      };

      // Save guarantor data
      staff.guarantor = {
        name: guarantor.name?.trim() || "",
        phone: guarantor.phone?.trim() || "",
        email: guarantor.email?.trim() || "",
        address: guarantor.address?.trim() || "",
        relationship: guarantor.relationship?.trim() || "",
        occupation: guarantor.occupation?.trim() || "",
        photo: guarantor.photo || "",
      };

      // If staff passport photo was uploaded via onboarding, also set the main photo
      if (onboardingData.photo && !staff.photo) {
        staff.photo = onboardingData.photo;
      }

      staff.onboardingComplete = true;
      await staff.save();

      return res.status(200).json({ message: "Onboarding form submitted successfully!" });
    } catch (err) {
      console.error("Onboarding POST error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
