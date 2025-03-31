// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const Stall = require("../models/Stall");
const { protectAdmin } = require("../middleware/authMiddleware");

// Get all vendors
router.get("/vendors", protectAdmin, async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reallocate vendor location
router.post("/reallocate/:vendorId", protectAdmin, async (req, res) => {
  try {
    const { location } = req.body;
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    vendor.location = location;
    await vendor.save();

    res.json({ message: "Vendor location updated successfully" });
  } catch (error) {
    console.error("Error reallocating vendor:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset all stalls
router.post("/reset-stalls", protectAdmin, async (req, res) => {
  try {
    await Stall.updateMany({}, { taken: false, vendorID: null });
    await Vendor.updateMany({}, { gpsCoordinates: null });
    res.json({ message: "All stalls have been reset successfully" });
  } catch (error) {
    console.error("Error resetting stalls:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all stalls
router.get("/stalls", protectAdmin, async (req, res) => {
  try {
    const stalls = await Stall.find();
    res.json(stalls);
  } catch (error) {
    console.error("Error fetching stalls:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new stall
router.post("/create-stall", protectAdmin, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    // Find the highest stall number to avoid duplicates
    const existingStalls = await Stall.find().sort({ name: -1 }).limit(1);
    let stallNumber = 1;
    if (existingStalls.length > 0) {
      const lastStallName = existingStalls[0].name; // e.g., "Stall 5"
      const lastNumber = parseInt(lastStallName.split(" ")[1]);
      stallNumber = lastNumber + 1;
    }
    const stallName = `Stall ${stallNumber}`;

    const newStall = new Stall({
      name: stallName,
      lat,
      lng,
      taken: false,
      vendorID: null,
    });

    await newStall.save();
    res.json(newStall);
  } catch (error) {
    console.error("Error creating stall:", error);
    if (error.code === 11000) {
      res.status(400).json({ message: "Stall name already exists" });
    } else {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
});

// Create multiple stalls (bulk placement)
router.post("/create-stalls-bulk", protectAdmin, async (req, res) => {
  try {
    const { stalls } = req.body;
    const existingStalls = await Stall.find().sort({ name: -1 }).limit(1);
    let stallNumber =
      existingStalls.length > 0
        ? parseInt(existingStalls[0].name.split(" ")[1])
        : 0;

    const newStalls = [];
    for (let i = 0; i < stalls.length; i++) {
      stallNumber += 1;
      const stallName = `Stall ${stallNumber}`;
      const newStall = new Stall({
        name: stallName,
        lat: stalls[i].lat,
        lng: stalls[i].lng,
        taken: false,
        vendorID: null,
      });
      newStalls.push(newStall);
    }

    await Stall.insertMany(newStalls);
    res.json(newStalls);
  } catch (error) {
    console.error("Error creating stalls in bulk:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update stall position
router.put("/update-stall/:stallId", protectAdmin, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const stall = await Stall.findById(req.params.stallId);
    if (!stall) return res.status(404).json({ message: "Stall not found" });

    // If the stall is booked, update the vendor's gpsCoordinates
    if (stall.taken && stall.vendorID) {
      const vendor = await Vendor.findById(stall.vendorID);
      if (vendor) {
        vendor.gpsCoordinates = `${lat},${lng}`;
        await vendor.save();
      }
    }

    stall.lat = lat;
    stall.lng = lng;
    await stall.save();

    res.json(stall);
  } catch (error) {
    console.error("Error updating stall position:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a stall
router.delete("/delete-stall/:stallId", protectAdmin, async (req, res) => {
  try {
    const stall = await Stall.findById(req.params.stallId);
    if (!stall) return res.status(404).json({ message: "Stall not found" });

    // If the stall is booked, clear the vendor's gpsCoordinates
    if (stall.taken && stall.vendorID) {
      const vendor = await Vendor.findById(stall.vendorID);
      if (vendor) {
        vendor.gpsCoordinates = null;
        await vendor.save();
      }
    }

    await stall.deleteOne();
    res.json({ message: "Stall deleted successfully" });
  } catch (error) {
    console.error("Error deleting stall:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear all stalls
router.delete("/clear-stalls", protectAdmin, async (req, res) => {
  try {
    // Clear gpsCoordinates for all vendors with booked stalls
    const bookedStalls = await Stall.find({ taken: true });
    const vendorIds = bookedStalls
      .filter((stall) => stall.vendorID)
      .map((stall) => stall.vendorID);
    if (vendorIds.length > 0) {
      await Vendor.updateMany(
        { _id: { $in: vendorIds } },
        { gpsCoordinates: null }
      );
    }

    // Delete all stalls
    await Stall.deleteMany({});
    res.json({ message: "All stalls have been cleared successfully" });
  } catch (error) {
    console.error("Error clearing stalls:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
