// backend/routes/stalls.js
const express = require("express");
const router = express.Router();
const Stall = require("../models/Stall");
const { protectVendor } = require("../middleware/authMiddleware");

// Get all stalls (for Places.jsx)
router.get("/", protectVendor, async (req, res) => {
  try {
    const stalls = await Stall.find();
    res.json(stalls);
  } catch (error) {
    console.error("Error fetching stalls:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get stall by vendor ID (for VendorDashboard.jsx)
router.get("/by-vendor/:vendorId", protectVendor, async (req, res) => {
  try {
    const stall = await Stall.findOne({
      vendorID: req.params.vendorId,
      taken: true,
    });

    if (!stall) {
      return res
        .status(404)
        .json({ message: "No stall booked by this vendor" });
    }

    res.json(stall);
  } catch (error) {
    console.error("Error in /by-vendor:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
