// backend/routes/authRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Vendor = require("../models/Vendor");
const User = require("../models/User");

const router = express.Router();

// Admin Credentials (move to .env in production)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123";

// Vendor Registration
router.post("/register/vendor", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      aadhaarID,
      category,
      location,
      businessName,
      panNumber,
      shopPhoto,
      vendorPhoto,
    } = req.body;

    console.log("Vendor registration payload:", req.body);

    // Validate required fields
    const requiredFields = {
      name,
      email,
      password,
      phone,
      aadhaarID,
      category,
      location,
      businessName,
      panNumber,
      shopPhoto,
      vendorPhoto,
    };
    const missingFields = Object.keys(requiredFields).filter(
      (key) => !req.body[key]
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Required fields missing",
        missingFields,
      });
    }

    // Check for existing email or aadhaarID
    const existingVendorByEmail = await Vendor.findOne({ email });
    const existingVendorByAadhaar = await Vendor.findOne({ aadhaarID });
    const existingUser = await User.findOne({ email });
    if (existingVendorByEmail || existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    if (existingVendorByAadhaar) {
      return res.status(400).json({ message: "Aadhaar ID already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new vendor
    const newVendor = new Vendor({
      name,
      email,
      password: hashedPassword,
      phone,
      aadhaarID,
      category,
      location,
      businessName,
      panNumber,
      shopPhoto,
      vendorPhoto,
      shopID: Math.floor(100000 + Math.random() * 900000), // Random 6-digit number
      role: "vendor",
      license: {
        documents: {
          aadhaarID, // Reuse from top-level
          panNumber,
          businessName,
          shopPhoto,
          vendorPhoto,
          gstNumber: "", // Optional
          licenseImage: "", // Optional
        },
      },
    });

    await newVendor.save();
    console.log("Vendor registered successfully:", newVendor._id);

    const token = jwt.sign(
      { id: newVendor._id, role: "vendor" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(201).json({
      message: "Vendor registered successfully!",
      token,
      vendor: {
        id: newVendor._id,
        name,
        email,
        phone,
      },
    });
  } catch (error) {
    console.error("Vendor registration error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      message: "Server error during vendor registration",
      error: error.message,
    });
  }
});

// User Registration
router.post("/register/user", async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    console.log("User registration payload:", req.body);

    if (!username || !email || !password || !phone) {
      const missingFields = Object.keys({
        username,
        email,
        password,
        phone,
      }).filter((key) => !req.body[key]);
      return res.status(400).json({
        message: "All fields are required for user registration",
        missingFields,
      });
    }

    const existingUser = await User.findOne({ email });
    const existingVendor = await Vendor.findOne({ email });
    if (existingUser || existingVendor) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phoneNumber: phone,
      role: "user",
    });

    await newUser.save();
    console.log("User registered successfully:", newUser._id);

    const token = jwt.sign(
      { id: newUser._id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(201).json({
      message: "User registered successfully!",
      token,
      user: {
        id: newUser._id,
        username,
        email,
        phone: newUser.phoneNumber,
      },
    });
  } catch (error) {
    console.error("User registration error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Duplicate key error", error: error.message });
    }
    res.status(500).json({
      message: "Server error during user registration",
      error: error.message,
    });
  }
});

// Admin Login
router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      return res.json({ message: "Admin login successful", token });
    }
    return res.status(401).json({ message: "Invalid admin credentials" });
  } catch (error) {
    console.error("Admin login error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Server error during admin login",
      error: error.message,
    });
  }
});

// Vendor Login
router.post("/vendor/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: vendor._id, role: "vendor" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({ message: "Vendor login successful", token });
  } catch (error) {
    console.error("Vendor login error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Server error during vendor login",
      error: error.message,
    });
  }
});

// User Login
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: user._id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({ message: "User login successful", token });
  } catch (error) {
    console.error("User login error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Server error during user login",
      error: error.message,
    });
  }
});

module.exports = router;
