const express = require("express");
const Vendor = require("../models/Vendor");
const Marketplace = require("../models/Marketplace");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all vendors for admin dashboard
router.get("/vendors", async (req, res) => {
    try {
      const vendors = await Vendor.find({}, "name shopID category licenseStatus licenseImage licenseDate");
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: "Error fetching vendors" });
    }
  });

// Reallocate vendor to a different spot
router.post("/reallocate/:id", protectAdmin, async (req, res) => {
    try {
        const { lat, lng } = req.body.location;
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        // Update vendor's location
        vendor.location = { lat, lng };
        await vendor.save();

        res.json({ message: "Vendor reallocated successfully", newLocation: vendor.location });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/approve-license/:vendorId", async (req, res) => {
    try {
      const { vendorId } = req.params;
      await Vendor.findByIdAndUpdate(vendorId, { licenseStatus: "completed" });
  
      res.json({ message: "License approved successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Error approving license" });
    }
  });

module.exports = router;
