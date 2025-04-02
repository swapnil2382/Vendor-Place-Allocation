// backend/routes/stalls.js
const express = require("express");
const router = express.Router();
const Stall = require("../models/Stall");
const { protectVendor } = require("../middleware/authMiddleware");

// Get all stalls (for Places.jsx)
router.get("/", protectVendor, async (req, res) => {
  try {
    // Fetch all stalls from the database
    const stalls = await Stall.find();
    if (!stalls || stalls.length === 0) {
      console.log("No stalls found in the database");
      return res.status(200).json([]); // Return empty array if no stalls
    }

    console.log(`Fetched ${stalls.length} stalls successfully`);
    res.status(200).json(stalls);
  } catch (error) {
    console.error("Error fetching stalls:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Server error while fetching stalls",
      error: error.message,
    });
  }
});

// Get stall by vendor ID (for VendorDashboard.jsx)
router.get("/by-vendor/:vendorId", protectVendor, async (req, res) => {
  try {
    const { vendorId } = req.params;

    // Validate vendorId
    if (!vendorId || !/^[0-9a-fA-F]{24}$/.test(vendorId)) {
      return res.status(400).json({ message: "Invalid vendor ID format" });
    }

    // Ensure the requesting vendor matches the vendorId (optional security check)
    if (req.vendor.id !== vendorId) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this stall" });
    }

    const stall = await Stall.findOne({
      vendorID: vendorId,
      taken: true,
    });

    if (!stall) {
      console.log(`No active stall found for vendor ID: ${vendorId}`);
      return res
        .status(404)
        .json({ message: "No stall booked by this vendor" });
    }

    // Check if the 24-hour attendance deadline has expired
    const now = new Date();
    const bookingTime = new Date(stall.bookingTime);
    const deadline = new Date(bookingTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    if (now > deadline && !stall.attendanceMarked) {
      // Reset stall if attendance not marked within 24 hours
      stall.taken = false;
      stall.vendorID = null;
      stall.bookingTime = null;
      stall.attendanceMarked = false;
      await stall.save();
      console.log(
        `Stall ${stall._id} reset due to expired attendance deadline`
      );
      return res
        .status(404)
        .json({ message: "Stall booking expired due to unmarked attendance" });
    }

    console.log(`Fetched stall for vendor ID: ${vendorId}`);
    res.status(200).json(stall);
  } catch (error) {
    console.error("Error in /by-vendor:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Server error while fetching stall",
      error: error.message,
    });
  }
});

module.exports = router;
