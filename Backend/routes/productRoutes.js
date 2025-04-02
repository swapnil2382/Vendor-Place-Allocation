const express = require("express");
const router = express.Router();
const Product = require("../models/Vendor");

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("vendorId", "name email");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
});

// Add a new product
router.post("/", async (req, res) => {
  try {
    const { name, price, description, vendorId, image, stock } = req.body;
    const newProduct = new Product({ name, price, description, vendorId, image, stock });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: "Error adding product", error: error.message });
  }
});

module.exports = router;
