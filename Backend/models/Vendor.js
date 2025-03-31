// backend/models/Vendor.js
const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  aadhaarID: { type: String, required: true, unique: true },
  shopID: { type: Number, unique: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  isProfileComplete: { type: Boolean, default: false },
  gpsCoordinates: { type: String, default: "" },
  lastAttendance: { type: Date }, // Ensure this is present
  // Other fields...
});

module.exports = mongoose.model("Vendor", VendorSchema);
