const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Vendor = require("../models/Vendor");
const { protectVendor, protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Configure Multer Storage for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// ✅ Serve uploaded files statically (Ensure this is in `server.js`)
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🏪 Get Logged-in Vendor Details
router.get("/me", protectVendor, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id).select("-password");
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });
        res.json(vendor);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 📍 Update Vendor Location
router.put("/update-location", protectVendor, async (req, res) => {
    try {
        const { location } = req.body;
        if (!location || !location.latitude || !location.longitude) {
            return res.status(400).json({ error: "Location (latitude & longitude) is required." });
        }

        const vendor = await Vendor.findByIdAndUpdate(
            req.vendor.id,
            { location },
            { new: true }
        );

        if (!vendor) return res.status(404).json({ error: "Vendor not found." });

        res.json({ message: "Location updated successfully", vendor });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", error: error.message });
    }
});

// ✅ Apply for Business License
router.post(
    "/apply-license",
    protectVendor,
    upload.fields([
        { name: "shopPhoto", maxCount: 1 },
        { name: "vendorPhoto", maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            console.log("📩 Incoming License Application Request:", req.body);
            console.log("📂 Uploaded Files:", req.files);

            // Extract required fields
            const { aadhaarID, panNumber, businessName, gstNumber, yearsInBusiness, businessDescription } = req.body;

            // Validate required fields
            if (!aadhaarID || !panNumber || !businessName) {
                return res.status(400).json({ message: "❌ Aadhaar ID, PAN Number, and Business Name are required." });
            }

            // Ensure files are uploaded
            if (!req.files || !req.files.shopPhoto || !req.files.vendorPhoto) {
                return res.status(400).json({ message: "❌ Both shopPhoto and vendorPhoto are required." });
            }

            // Store uploaded file paths
            const shopPhotoUrl = `http://localhost:5000/uploads/${req.files.shopPhoto[0].filename}`;
            const vendorPhotoUrl = `http://localhost:5000/uploads/${req.files.vendorPhoto[0].filename}`;

            // Find the vendor
            const vendor = await Vendor.findById(req.vendor.id);
            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }

            // Update vendor's license details & status
            vendor.panNumber = panNumber;
            vendor.businessName = businessName;
            vendor.license = {
                documents: {
                    aadhaarID,
                    panNumber,
                    businessName,
                    gstNumber,
                    yearsInBusiness,
                    businessDescription,
                    shopPhoto: shopPhotoUrl,
                    vendorPhoto: vendorPhotoUrl
                },
                appliedAt: new Date()
            };
            vendor.licenseStatus = "waiting"; // ⏳ Set status to waiting for approval

            await vendor.save();
            res.json({ message: "✅ License application submitted successfully.", status: "waiting" });
        } catch (error) {
            console.error("❌ Server Error:", error);
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
);

// ✅ Admin Approves License
router.post("/admin/approve-license/:vendorId", protectAdmin, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.vendorId);
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        vendor.licenseStatus = "completed"; // ✅ Mark as completed
        await vendor.save();

        res.json({ message: "✅ License approved successfully.", status: "completed" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 🏬 Get All Vendors for Marketplace
router.get("/marketplace", async (req, res) => {
    try {
        const vendors = await Vendor.find({ isActive: true }).select("name category location shopID");
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// 📝 Complete Vendor Profile
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

// 🛒 Upload Products
router.post("/add-product", protectVendor, async (req, res) => {
    try {
        const { name, image, description, price } = req.body;
        const vendor = await Vendor.findById(req.vendor.id);
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        vendor.products.push({ name, image, description, price });
        await vendor.save();

        res.json({ message: "Product added successfully", products: vendor.products });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 📦 Get Vendor Orders
router.get("/orders", protectVendor, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.vendor.id).populate("orders.userId", "username email");
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        res.json(vendor.orders);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ Complete an Order
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
