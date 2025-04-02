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
      _v1Compatibility: true,
    },
    gpsLocation: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
    },
    gpsCoordinates: { type: String, default: "" },
    lastAttendance: { type: Date },
    spotType: {
      type: String,
      enum: ["Permanent", "Temporary"],
      default: "Temporary",
    },
    alternateSpot: { type: String, default: "" },
    products: [
      {
        name: { type: String, required: true },
        image: { type: String, default: "" },
        description: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 },
        category: { type: String, required: true },
        stock: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
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
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Added
        productName: { type: String, required: true }, // Renamed from product
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }, // Added
        status: {
          type: String,
          enum: ["Pending", "Completed"],
          default: "Pending",
        },
        orderedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

VendorSchema.pre("save", function (next) {
  if (
    this.location &&
    typeof this.location === "object" &&
    this.location.latitude &&
    this.location.longitude
  ) {
    console.log(`Converting location object to string for vendor ${this._id}`);
    this.location = `${this.location.latitude},${this.location.longitude}`;
  }
  next();
});

module.exports = mongoose.model("Vendor", VendorSchema);