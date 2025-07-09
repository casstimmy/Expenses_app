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
      minlength: 4, // Allow 4-digit PINs
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "Senior staff", "staff"],
      default: "staff",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving (only if it's new or modified)
StaffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// Method to compare password (useful in login)
StaffSchema.methods.comparePassword = async function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};



// Export safely
export const Staff = mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
