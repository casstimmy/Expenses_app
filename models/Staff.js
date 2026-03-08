import mongoose from "mongoose";
import bcrypt from "bcrypt";

const StaffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "Senior staff", "staff", "junior staff", "account"],
      default: "staff",
    },
    active: {
      type: Boolean,
      default: true,
    },
    bank: {
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
    },
    salary: {
      type: Number,
      default: 0,
    },
    penalty: [
      {
        amount: { type: Number, required: true },
        reason: { type: String, trim: true },
        date: { type: Date, default: Date.now },
      },
    ],
    photo: { type: String, default: "" },
    onboardingToken: { type: String, unique: true, sparse: true },
    onboardingComplete: { type: Boolean, default: false },
    onboardingData: {
      fullName: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      dateOfBirth: { type: String, trim: true },
      stateOfOrigin: { type: String, trim: true },
      nextOfKin: { type: String, trim: true },
      nextOfKinPhone: { type: String, trim: true },
      photo: { type: String },
    },
    guarantor: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      address: { type: String, trim: true },
      relationship: { type: String, trim: true },
      occupation: { type: String, trim: true },
      photo: { type: String },
    },
  },
  { timestamps: true }
);

// Hash password before saving
StaffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
StaffSchema.methods.comparePassword = async function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

export const Staff = mongoose.models.Staff || mongoose.model("Staff", StaffSchema, "staffs");
