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

    // Business & Personal Details
    businessName: String,
    businessDescription: String,
    alternateContact: String,
    gstNumber: String,
    panNumber: String,
    yearsInBusiness: Number,
    shopPhoto: String,  // URL for uploaded image
    vendorPhoto: String, // URL for uploaded image

    // Location & Spot Assignment
    preferredMarketArea: String,
    gpsCoordinates: { type: String, default: "" },
    spotType: { type: String, enum: ["Permanent", "Temporary"], default: "Temporary" },
    alternateSpot: String,

    // Product & Inventory Details
    productsSold: [String],
    dailyStock: Number,
    peakSellingHours: String,
    priceRange: String,

    // Vendor Operations & Compliance
    hasTradeLicense: { type: Boolean, default: false },
    requiresStorage: { type: Boolean, default: false },
    emergencyContact: String,
});

module.exports = mongoose.model("Vendor", VendorSchema);
