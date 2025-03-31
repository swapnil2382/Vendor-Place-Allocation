const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema(
  {
    // 🔹 Vendor Basic Details
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    aadhaarID: { type: String, required: true, unique: true },

    // 🔹 Shop & Business Information
    shopID: {
      type: Number,
      unique: true,
      default: () => Math.floor(100000 + Math.random() * 900000), // Auto-generate unique shop ID
    },
    category: { type: String, required: true },
    businessName: { type: String, required: true },
    businessDescription: { type: String, default: "" },
    alternateContact: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    panNumber: { type: String, required: true },
    yearsInBusiness: { type: Number, default: 0 },
    shopPhoto: { type: String, default: "" }, // Image URL
    vendorPhoto: { type: String, default: "" }, // Image URL

    // 🔹 Vendor Profile Completion Status
    isProfileComplete: { type: Boolean, default: false },

    // 🔹 Location & Spot Assignment
    preferredMarketArea: { type: String, default: "" },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    spotType: { type: String, enum: ["Permanent", "Temporary"], default: "Temporary" },
    alternateSpot: { type: String, default: "" },

    // 🔹 Product & Inventory Details
    products: [
      {
        name: { type: String, required: true },
        image: { type: String, required: true }, // Image URL
        description: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    dailyStock: { type: Number, default: 0 },
    peakSellingHours: { type: String, default: "" },
    priceRange: { type: String, default: "" },

    // 🔹 License & Compliance
    hasTradeLicense: { type: Boolean, default: false },
    license: {
      status: {
        type: String,
        enum: ["not issued", "issued", "completed"],
        default: "not issued",
      }, // License approval status
      licenseNumber: { type: String, default: "" }, // License number (if approved)
      appliedAt: { type: Date, default: null }, // Application date
      approvedAt: { type: Date, default: null }, // Approval date
      documents: {
        aadhaarID: { type: String, required: true },
        panNumber: { type: String, required: true },
        gstNumber: { type: String, default: "" },
        shopPhoto: { type: String, required: true },
        vendorPhoto: { type: String, required: true },
        licenseImage: { type: String, default: "" }, // Uploaded license image URL
      },
    },

    // 🔹 Additional Operations
    requiresStorage: { type: Boolean, default: false },
    emergencyContact: { type: String, default: "" },

    // 🔹 Orders Received from Users
    orders: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        product: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
        orderedAt: { type: Date, default: Date.now }, // Timestamp for tracking orders
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", VendorSchema);
