const mongoose = require("mongoose");

const stallSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Auto-generated stall ID (e.g., "Stall 1")
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  locationName: { type: String, required: true }, // New field for location name (e.g., "Downtown Market Square")
  taken: { type: Boolean, default: false },
  bookingTime: { type: Date, default: null },
  vendorID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    default: null,
  },
});

module.exports = mongoose.model("Stall", stallSchema);
