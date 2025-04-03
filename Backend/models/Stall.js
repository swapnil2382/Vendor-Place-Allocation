const mongoose = require("mongoose");

const stallSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  locationName: { type: String, required: true },
  taken: { type: Boolean, default: false },
  vendorID: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", default: null },
  bookingTime: { type: Date, default: null },
  history: [
    {
      vendorID: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
      vendorName: { type: String },
      shopID: { type: String },
      bookedOn: { type: Date },
      unbookedOn: { type: Date, default: null },
    },
  ],
});

module.exports = mongoose.model("Stall", stallSchema);