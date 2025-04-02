// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const User = require("../models/User");
const { protectUser } = require("../middleware/authMiddleware");

router.get("/products", protectUser, async (req, res) => {
  try {
    const vendors = await Vendor.find({});
    console.log(`Found ${vendors.length} vendors`);
    const products = vendors.flatMap((vendor) => {
      console.log(`Vendor ${vendor._id} has ${vendor.products.length} products`);
      return vendor.products;
    });
    console.log(`User ${req.user._id} fetched ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error("Error in /api/users/products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/orders", protectUser, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    const userId = req.user._id;

    for (const item of items) {
      const vendor = await Vendor.findOne({ "products._id": item.productId });
      if (!vendor) {
        return res.status(404).json({ message: `Vendor for product ${item.productName} not found` });
      }

      const product = vendor.products.id(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productName} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.productName}` });
      }

      vendor.orders.push({
        userId,
        productId: item.productId,
        productName: item.productName,
        productImage: product.image, // Store the image when order is placed
        quantity: item.quantity,
        price: item.price,
        status: "Pending",
      });

      await vendor.save();
      console.log(`Order placed for ${item.productName} by user ${userId} to vendor ${vendor._id}`);
    }

    res.status(201).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error("Error in /api/users/orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/my-orders", protectUser, async (req, res) => {
  try {
    const vendors = await Vendor.find({ "orders.userId": req.user._id });
    console.log(`Raw vendors with orders:`, vendors.map(v => ({ id: v._id, orders: v.orders })));

    const userOrders = vendors.flatMap((vendor) => {
      const filteredOrders = vendor.orders.filter((order) =>
        order.userId.toString() === req.user._id.toString()
      );
      return filteredOrders.map((order) => {
        // Find the product in the vendor's products array to get the image
        const product = vendor.products.id(order.productId);
        return {
          _id: order._id,
          product: {
            name: order.productName,
            image: product ? product.image : null, // Include image from product
          },
          productName: order.productName,
          quantity: order.quantity,
          price: order.price,
          status: order.status,
          orderedAt: order.orderedAt || new Date(),
          vendorId: { _id: vendor._id, businessName: vendor.businessName },
        };
      });
    });

    console.log(`Returning ${userOrders.length} orders for user ${req.user._id}`);
    res.json(userOrders);
  } catch (error) {
    console.error("Error in /api/users/my-orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/me", protectUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error in /api/users/me:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;