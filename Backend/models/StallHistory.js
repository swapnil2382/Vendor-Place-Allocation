const mongoose = require("mongoose");

const stallHistorySchema = new mongoose.Schema({
  stallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stall",
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: false, // Can be null if unassigned
  },
  vendorName: {
    type: String,
    required: false,
  },
  shopID: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ["assigned", "unassigned"],
    required: true,
  },
  bookedOn: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("StallHistory", stallHistorySchema);