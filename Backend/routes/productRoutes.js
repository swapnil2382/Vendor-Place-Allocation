// backend/routes/productRoutes.js
const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor"); // Correct import

// Get all products for a specific vendor
router.get("/:vendorId", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.json(vendor.products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
});

// Add a new product to a vendor's product list
router.post("/:vendorId", async (req, res) => {
  try {
    const { name, price, description, image, stock, category } = req.body;
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const newProduct = {
      name,
      price,
      description,
      image: image || "",
      stock: stock || 0,
      category,
      createdAt: new Date(),
    };

    vendor.products.push(newProduct);
    await vendor.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: "Error adding product", error: error.message });
  }
});

module.exports = router;