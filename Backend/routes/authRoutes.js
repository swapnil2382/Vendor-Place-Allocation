// backend/routes/authRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Vendor = require("../models/Vendor");
const User = require("../models/User");

const router = express.Router();

// Admin Credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "123";

// Vendor Registration
router.post("/register/vendor", async (req, res) => {
  try {
    const { name, email, password, phone, aadhaarID, category, location } = req.body;
    console.log("Vendor registration request:", req.body); // Debug log

    if (!name || !email || !password || !phone || !aadhaarID || !category || !location) {
      return res.status(400).json({ message: "All fields are required for vendor registration" });
    }

    if (await Vendor.findOne({ email }) || await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newVendor = new Vendor({
      name,
      email,
      password: hashedPassword,
      phone,
      aadhaarID,
      category,
      location,
      role: "vendor",
    });

    await newVendor.save();
    res.status(201).json({ message: "Vendor registered successfully!" });
  } catch (error) {
    console.error("Vendor Registration Error:", error.message, error.stack); // Enhanced logging
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// User Registration
router.post("/register/user", async (req, res) => {
    try {
      const { username, email, password, phone } = req.body;
      console.log("User registration request:", req.body);
  
      if (!username || !email || !password || !phone) {
        return res.status(400).json({ message: "All fields are required for user registration" });
      }
  
      if (await User.findOne({ email }) || await Vendor.findOne({ email })) {
        return res.status(400).json({ message: "Email already in use" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        phone,
        role: "user",
      });
  
      await newUser.save();
      console.log("User saved:", newUser._id); // Confirm save
      res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
      console.error("User Registration Error:", error.message, error.stack);
      if (error.code === 11000) {
        return res.status(400).json({ message: "Duplicate key error", error: error.message });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

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
    console.error("Vendor Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// User Login
router.post("/user/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ message: "User login successful", token });
  } catch (error) {
    console.error("User Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;