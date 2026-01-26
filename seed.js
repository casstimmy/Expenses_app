// Seed test data
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const StaffSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 4 },
  location: { type: String, required: true, trim: true },
  role: { type: String, enum: ["admin", "Senior staff", "staff", "junior staff"], default: "staff" },
  active: { type: Boolean, default: true },
  bank: {
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
  },
  salary: { type: Number, default: 0 },
  penalty: [{ amount: { type: Number }, reason: { type: String, trim: true }, date: { type: Date, default: Date.now } }],
}, { timestamps: true });

const Staff = mongoose.model("Staff", StaffSchema);

async function seed() {
  try {
    const mongoUri = "mongodb+srv://helloayoola:QRjsYWk5wgwnFRzy@expense.jwemnef.mongodb.net/?appName=expense";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if staff already exists
    const existingStaff = await Staff.findOne({ name: "John Doe" });
    if (existingStaff) {
      console.log("Staff already exists, skipping...");
      await mongoose.disconnect();
      return;
    }

    // Hash password "1234"
    const hashedPassword = await bcrypt.hash("1234", 10);

    const testStaff = new Staff({
      name: "John Doe",
      password: hashedPassword,
      location: "Ibile 1",
      role: "admin",
      active: true,
      bank: {
        accountName: "John Doe",
        accountNumber: "1234567890",
        bankName: "First Bank",
      },
      salary: 50000,
    });

    await testStaff.save();
    console.log("✅ Test staff created successfully!");
    console.log("Login with: name='John Doe', password='1234'");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seed();
