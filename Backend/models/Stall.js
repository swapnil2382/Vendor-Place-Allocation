// backend/models/Stall.js
const mongoose = require("mongoose");

const stallSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  taken: { type: Boolean, default: false }, // true = taken, false = available
});

module.exports = mongoose.model("Stall", stallSchema);
