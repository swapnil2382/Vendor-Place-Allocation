const express = require("express");
const bcrypt = require("bcryptjs");
const Vendor = require("../models/Vendor");
const { protectVendor } = require("../middleware/authMiddleware");

const router = express.Router();

// Get logged-in vendor details
router.get("/me", protectVendor, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id).select("-password"); // Exclude password
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });
        res.json(vendor);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get all vendors for marketplace
router.get("/marketplace", async (req, res) => {
    try {
        const vendors = await Vendor.find({ isActive: true }).select("name category location shopID");
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Mark vendor attendance
router.post("/mark-attendance", protectVendor, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id);
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        // Update attendance logic
        vendor.lastAttendance = new Date();
        await vendor.save();

        res.json({ message: "Attendance marked successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Register a new vendor
router.post("/register", async (req, res) => {
    const { name, email, password, phone, aadhaarID, category, location } = req.body;

    try {
        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({ email });
        if (existingVendor) {
            return res.status(400).json({ message: "Vendor already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Find the last vendor with the highest shopID
        const lastVendor = await Vendor.findOne().sort({ shopID: -1 });

        // Ensure shopID is always a number and starts from 101
        const nextShopID = lastVendor && !isNaN(lastVendor.shopID) 
            ? Number(lastVendor.shopID) + 1 
            : 101;

        console.log("Generated shopID:", nextShopID); // Debugging

        // Create new vendor
        const newVendor = new Vendor({
            name,
            email,
            password: hashedPassword,
            phone,
            aadhaarID,
            shopID: nextShopID, // Now it's guaranteed to be a valid number
            category,
            location
        });

        await newVendor.save();

        res.status(201).json({ message: "Vendor registered successfully", shopID: nextShopID });
    } catch (error) {
        console.error("Error in register:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.put("/complete-profile", protectVendor, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id);
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        // Update profile fields
        Object.assign(vendor, req.body, { isProfileComplete: true });
        await vendor.save();

        res.json({ message: "Profile updated successfully", vendor });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 🏪 Get Vendor Profile
router.get("/profile", protectVendor, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id).select("-password");
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        res.json(vendor);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
module.exports = router;
