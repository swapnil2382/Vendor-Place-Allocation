const express = require("express");
const Vendor = require("../models/Vendor");
const Marketplace = require("../models/Marketplace");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all vendors for admin dashboard
router.get("/vendors", protectAdmin, async (req, res) => {
    try {
        const vendors = await Vendor.find().select("name email shopID location isActive");
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
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


module.exports = router;
