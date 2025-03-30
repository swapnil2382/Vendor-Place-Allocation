const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Vendor = require("../models/Vendor");

const router = express.Router();

// Fixed admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "123";

// Admin Login
router.post("/admin/login", async (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "2h" });
        return res.json({ message: "Admin login successful", token });
    }

    return res.status(401).json({ message: "Invalid admin credentials" });
});

// Vendor Login
router.post("/vendor/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const vendor = await Vendor.findOne({ email });
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        const isMatch = await bcrypt.compare(password, vendor.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: vendor._id, role: "vendor" }, process.env.JWT_SECRET, { expiresIn: "2h" });
        res.json({ message: "Vendor login successful", token });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
