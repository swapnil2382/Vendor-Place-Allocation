const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const Stall = require("../models/Stall");
const { protectAdmin } = require("../middleware/authMiddleware");

// Get all vendors
router.get("/vendors", protectAdmin, async (req, res) => {
  try {
    const vendors = await Vendor.find().select("name shopID category license");
    res.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reallocate vendor location
router.post("/reallocate/:vendorId", protectAdmin, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    if (req.body.location) {
      if (typeof req.body.location === "string") {
        vendor.location = req.body.location;
      } else if (req.body.location.latitude && req.body.location.longitude) {
        vendor.gpsLocation = {
          latitude: req.body.location.latitude,
          longitude: req.body.location.longitude,
        };
        vendor.gpsCoordinates = `${req.body.location.latitude},${req.body.location.longitude}`;
      }
    }

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
    const { lat, lng, locationName } = req.body;
    if (!lat || !lng || !locationName) {
      return res
        .status(400)
        .json({ message: "lat, lng, and locationName are required" });
    }

    // Check if there are any existing locations with unassigned stalls
    const existingStalls = await Stall.find({ locationName });
    if (
      existingStalls.length > 0 &&
      existingStalls.some((stall) => !stall.taken)
    ) {
      return res.status(400).json({
        message:
          "Please assign all stalls in the current location before creating a new one.",
      });
    }

    const stallCount = await Stall.countDocuments({ locationName });
    const stallName = `${locationName} Stall ${stallCount + 1}`;

    const newStall = new Stall({
      name: stallName,
      lat,
      lng,
      locationName,
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
    const { stalls, locationName } = req.body;
    if (!locationName) {
      return res.status(400).json({ message: "locationName is required" });
    }

    // Check if there are any existing locations with unassigned stalls
    const existingStalls = await Stall.find({ locationName });
    if (
      existingStalls.length > 0 &&
      existingStalls.some((stall) => !stall.taken)
    ) {
      return res.status(400).json({
        message:
          "Please assign all stalls in the current location before creating a new one.",
      });
    }

    let stallCount = await Stall.countDocuments({ locationName });

    const newStalls = [];
    for (let i = 0; i < stalls.length; i++) {
      stallCount += 1;
      const stallName = `${locationName} Stall ${stallCount}`;
      const newStall = new Stall({
        name: stallName,
        lat: stalls[i].lat,
        lng: stalls[i].lng,
        locationName,
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

    await Stall.deleteMany({});
    res.json({ message: "All stalls have been cleared successfully" });
  } catch (error) {
    console.error("Error clearing stalls:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
