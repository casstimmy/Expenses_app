import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";
import { getAuthStaff, requireAuth } from "@/lib/auth";
import bcrypt from "bcrypt";

function normalizeOnboardingData(data = {}) {
  return {
    fullName: data.fullName ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    address: data.address ?? "",
    dateOfBirth: data.dateOfBirth ?? "",
    stateOfOrigin: data.stateOfOrigin ?? "",
    nextOfKin: data.nextOfKin ?? "",
    nextOfKinPhone: data.nextOfKinPhone ?? "",
    photo: data.photo ?? "",
  };
}

function normalizeGuarantor(data = {}) {
  return {
    name: data.name ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    address: data.address ?? "",
    relationship: data.relationship ?? "",
    occupation: data.occupation ?? "",
    photo: data.photo ?? "",
  };
}

export default async function handler(req, res) {
  const { id } = req.query;

  await mongooseConnect();

  if (req.method === "GET") {
    const authStaff = await requireAuth(req, res);
    if (!authStaff) return;
    try {
      const staffData = await Staff.findById(id);
      if (!staffData) {
        return res.status(404).json({ message: "Staff not found" });
      }
      res.status(200).json(staffData);
    } catch (err) {
      console.error("Get staff failed:", err);
      res.status(500).json({ message: "Server error" });
    }
  } else if (req.method === "PUT") {
    const authStaff = await getAuthStaff(req);
    if (!authStaff) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }
    if (authStaff.role !== "admin") {
      return res.status(403).json({ message: "You dont have the permission to edit." });
    }
	const {
      name,
      password,
      location,
      role,
      bank,
      salary,
      photo,
      onboardingData,
      guarantor,
      onboardingComplete,
    } = req.body;


   const missingFields = [];
if (!name) missingFields.push("name");
if (!location) missingFields.push("location");
if (!role) missingFields.push("role");

if (missingFields.length > 0) {
  return res.status(400).json({ message: `Missing fields: ${missingFields.join(", ")}` });
}


    const updateData = {
      name,
      location,
      role,
      ...(typeof salary !== "undefined" && salary !== null ? { salary } : {}),
      ...(typeof photo === "string" ? { photo } : {}),
     ...(bank ? {
  bank: {
    accountName: bank?.accountName ?? "",
    accountNumber: bank?.accountNumber ?? "",
    bankName: bank?.bankName ?? "",
  }
} : {}),
      ...(onboardingData ? { onboardingData: normalizeOnboardingData(onboardingData) } : {}),
      ...(guarantor ? { guarantor: normalizeGuarantor(guarantor) } : {}),
      ...(
        typeof onboardingComplete === "boolean"
          ? { onboardingComplete }
          : onboardingData || guarantor
            ? { onboardingComplete: true }
            : {}
      ),

    };

    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      updateData.password = hashed;
    }

    try {
      await Staff.findByIdAndUpdate(id, updateData);
      res.status(200).json({ message: "Staff updated" });
    } catch (err) {
      console.error("Update failed:", err);
      res.status(500).json({ message: "Server error" });
    }
  } else if (req.method === "DELETE") {
    const authStaff = await getAuthStaff(req);
    if (!authStaff) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }
    if (authStaff.role !== "admin") {
      return res.status(403).json({ message: "You dont have the permission to delete." });
    }
    try {
      await Staff.findByIdAndDelete(id);
      res.status(200).json({ message: "Staff deleted" });
    } catch (err) {
      console.error("Delete failed:", err);
      res.status(500).json({ message: "Server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
