// backend/routes/vendorRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Vendor = require("../models/Vendor");
const Stall = require("../models/Stall");
const { protectVendor, protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Set up file uploads configuration
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

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

// Apply for Business License
router.post(
  "/apply-license",
  protectVendor,
  upload.fields([
    { name: "shopPhoto", maxCount: 1 },
    { name: "vendorPhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("📩 Incoming License Application Request:", req.body);
      console.log("📂 Uploaded Files:", req.files);

      const {
        aadhaarID,
        panNumber,
        businessName,
        gstNumber,
        yearsInBusiness,
        businessDescription,
      } = req.body;

      if (!aadhaarID || !panNumber || !businessName) {
        return res.status(400).json({
          message: "❌ Aadhaar ID, PAN Number, and Business Name are required.",
        });
      }

      if (!req.files || !req.files.shopPhoto || !req.files.vendorPhoto) {
        return res
          .status(400)
          .json({ message: "❌ Both shopPhoto and vendorPhoto are required." });
      }

      const shopPhotoUrl = `http://localhost:5000/uploads/${req.files.shopPhoto[0].filename}`;
      const vendorPhotoUrl = `http://localhost:5000/uploads/${req.files.vendorPhoto[0].filename}`;

      const vendor = await Vendor.findById(req.vendor.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      vendor.panNumber = panNumber;
      vendor.businessName = businessName;
      vendor.license = {
        status: "requested",
        documents: {
          aadhaarID,
          panNumber,
          businessName,
          gstNumber: gstNumber || "",
          yearsInBusiness: Number(yearsInBusiness) || 0, // Convert to number
          businessDescription: businessDescription || "",
          shopPhoto: shopPhotoUrl,
          vendorPhoto: vendorPhotoUrl,
        },
        appliedAt: new Date(),
      };

      await vendor.save();
      res.json({
        message: "✅ License application submitted successfully.",
        status: "requested",
      });
    } catch (error) {
      console.error("❌ Server Error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Admin Approves License
router.post(
  "/admin/approve-license/:vendorId",
  protectAdmin,
  async (req, res) => {
    try {
      const vendor = await Vendor.findById(req.params.vendorId);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });

      vendor.license.status = "completed";
      vendor.license.approvedAt = new Date();
      vendor.license.licenseNumber = `LIC-${vendor.shopID}-${Date.now()}`; // Generate a unique license number
      await vendor.save();

      res.json({
        message: "✅ License approved successfully.",
        status: "completed",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Update vendor location
router.put("/update-location", protectVendor, async (req, res) => {
  try {
    const { location } = req.body;
    if (!location || !location.latitude || !location.longitude) {
      return res
        .status(400)
        .json({ error: "Location (latitude & longitude) is required." });
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.vendor.id,
      { location },
      { new: true }
    );

    if (!vendor) return res.status(404).json({ error: "Vendor not found." });

    res.json({ message: "Location updated successfully", vendor });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", error: error.message });
  }
});

// Get all active vendors for marketplace
router.get("/marketplace", async (req, res) => {
  try {
    const vendors = await Vendor.find({ isActive: true }).select(
      "name category location shopID"
    );
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Complete vendor profile
router.put("/complete-profile", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    Object.assign(vendor, req.body, { isProfileComplete: true });
    await vendor.save();

    res.json({ message: "Profile updated successfully", vendor });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add a product
router.post("/add-product", protectVendor, async (req, res) => {
  try {
    const { name, image, description, price } = req.body;
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    vendor.products.push({ name, image, description, price });
    await vendor.save();

    res.json({
      message: "Product added successfully",
      products: vendor.products,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get vendor orders
router.get("/orders", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id).populate(
      "orders.userId",
      "username email"
    );
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.json(vendor.orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Complete an order
router.put("/complete-order/:orderId", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const order = vendor.orders.id(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = "Completed";
    await vendor.save();

    res.json({ message: "Order marked as completed", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
