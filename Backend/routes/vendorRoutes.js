// backend/routes/vendorRoutes.js
const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const Stall = require("../models/Stall");
const { protectVendor } = require("../middleware/authMiddleware");

// Get logged-in vendor details
router.get("/me", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id).select("-password");
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    console.log("Returning vendor data:", vendor);
    res.json(vendor);
  } catch (error) {
    console.error("Error in /me:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Claim a stall
router.post("/claim-stall/:stallId", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const stall = await Stall.findById(req.params.stallId);
    if (!stall) return res.status(404).json({ message: "Stall not found" });
    if (stall.taken)
      return res.status(400).json({ message: "Stall already taken" });

    // Check if the vendor already has a stall booked
    const existingStall = await Stall.findOne({
      vendorID: vendor._id,
      taken: true,
    });

    if (existingStall) {
      return res.status(400).json({
        message:
          "You already have a stall booked. Please unbook your current stall before booking a new one.",
        currentStall: {
          id: existingStall._id,
          name: existingStall.name,
          lat: existingStall.lat,
          lng: existingStall.lng,
        },
      });
    }

    // Assign the stall to the vendor
    stall.taken = true;
    stall.vendorID = vendor._id;
    await stall.save();

    // Update the vendor's gpsCoordinates
    vendor.gpsCoordinates = `${stall.lat},${stall.lng}`;
    await vendor.save();

    console.log("Vendor updated with gpsCoordinates:", vendor.gpsCoordinates);

    res.json({
      message: "Stall booked successfully",
      stall: {
        name: stall.name,
        lat: stall.lat,
        lng: stall.lng,
        vendorID: stall.vendorID,
      },
    });
  } catch (error) {
    console.error("Error in /claim-stall:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Unbook a stall
router.post("/unbook-stall", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const stall = await Stall.findOne({ vendorID: vendor._id, taken: true });
    if (!stall) {
      return res
        .status(404)
        .json({ message: "No stall booked by this vendor" });
    }

    stall.taken = false;
    stall.vendorID = null;
    await stall.save();

    vendor.gpsCoordinates = null;
    await vendor.save();

    console.log("Stall unbooked for vendor:", vendor._id);

    res.json({ message: "Stall unbooked successfully" });
  } catch (error) {
    console.error("Error in /unbook-stall:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Mark vendor attendance
router.post("/mark-attendance", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    vendor.lastAttendance = new Date();
    await vendor.save();

    res.json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Error in /mark-attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
