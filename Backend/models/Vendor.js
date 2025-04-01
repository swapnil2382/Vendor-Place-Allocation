// backend/models/Vendor.js
const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    aadhaarID: { type: String, required: true, unique: true },
    shopID: {
      type: Number,
      unique: true,
      default: () => Math.floor(100000 + Math.random() * 900000),
    },
    category: { type: String, required: true },
    businessName: { type: String, required: true },
    businessDescription: { type: String, default: "" },
    alternateContact: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    panNumber: { type: String, required: true },
    yearsInBusiness: { type: Number, default: 0 },
    shopPhoto: { type: String, default: "" },
    vendorPhoto: { type: String, default: "" },
    isProfileComplete: { type: Boolean, default: false },
    preferredMarketArea: { type: String, default: "" },
    location: {
      type: String,
      required: true,
      // Adding compatibility with the new location structure
      _v1Compatibility: true,
    },
    // New location structure
    gpsLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    gpsCoordinates: { type: String, default: "" }, // Keep for backward compatibility
    lastAttendance: { type: Date }, // Added from original schema
    spotType: {
      type: String,
      enum: ["Permanent", "Temporary"],
      default: "Temporary",
    },
    alternateSpot: { type: String, default: "" },
    products: [
      {
        name: { type: String, required: true },
        image: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    dailyStock: { type: Number, default: 0 },
    peakSellingHours: { type: String, default: "" },
    priceRange: { type: String, default: "" },
    hasTradeLicense: { type: Boolean, default: false },
    license: {
      status: {
        type: String,
        enum: ["not issued", "requested", "issued", "completed"],
        default: "not issued",
      },
      licenseNumber: { type: String, default: "" },
      appliedAt: { type: Date, default: null },
      approvedAt: { type: Date, default: null },
      documents: {
        aadhaarID: { type: String, required: true },
        panNumber: { type: String, required: true },
        businessName: { type: String, required: true },
        gstNumber: { type: String, default: "" },
        shopPhoto: { type: String, required: true },
        vendorPhoto: { type: String, required: true },
        licenseImage: { type: String, default: "" },
      },
    },
    requiresStorage: { type: Boolean, default: false },
    emergencyContact: { type: String, default: "" },
    orders: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        product: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        status: {
          type: String,
          enum: ["Pending", "Completed"],
          default: "Pending",
        },
        orderedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", VendorSchema);
