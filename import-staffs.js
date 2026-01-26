// Import staffs.json into local MongoDB
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

async function importData() {
  try {
    // Connect to local MongoDB
    await mongoose.connect("mongodb://localhost:27017/test");
    console.log("✅ Connected to local MongoDB");

    // Define the Staff schema
    const StaffSchema = new mongoose.Schema({
      name: String,
      password: String,
      location: String,
      role: String,
      active: Boolean,
      bank: {
        accountName: String,
        accountNumber: String,
        bankName: String,
      },
      salary: Number,
      penalty: [],
      createdAt: Date,
      updatedAt: Date,
    });

    const Staff = mongoose.model("Staff", StaffSchema, "staffs");

    // Clear existing data
    await Staff.deleteMany({});
    console.log("🗑️  Cleared existing staff records");

    // Create test staff with hashed passwords
    const testStaff = [
      {
        name: "Chioma",
        password: await bcrypt.hash("1234", 10), // Hash the password
        location: "Ibile 1",
        role: "admin",
        active: true,
        bank: {
          accountName: "Chioma Account",
          accountNumber: "1234567890",
          bankName: "First Bank",
        },
        salary: 160000,
      },
      {
        name: "Ayoola",
        password: await bcrypt.hash("5678", 10), // Hash the password
        location: "Ibile 1",
        role: "admin",
        active: true,
        bank: {
          accountName: "Ayoola Account",
          accountNumber: "0987654321",
          bankName: "Zenith Bank",
        },
        salary: 150000,
      },
      {
        name: "Emma",
        password: await bcrypt.hash("9999", 10), // Hash the password
        location: "Ibile 2",
        role: "staff",
        active: true,
        bank: {
          accountName: "Emma Account",
          accountNumber: "1122334455",
          bankName: "GTBank",
        },
        salary: 80000,
      },
    ];

    const result = await Staff.insertMany(testStaff);
    console.log(`✅ Created ${result.length} staff members with hashed passwords!`);
    console.log("\n📝 Test Staff Logins:");
    console.log("  👤 Chioma - PIN: 1234 (Ibile 1) - admin");
    console.log("  👤 Ayoola - PIN: 5678 (Ibile 1) - admin");
    console.log("  👤 Emma   - PIN: 9999 (Ibile 2) - staff");

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

importData();

