// backend/routes/chatbotRoutes.js
const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const DailyStall = require("../models/Stall");
const { protectVendor } = require("../middleware/authMiddleware");

// Utility function to calculate sales trend
const calculateSalesTrend = (orders) => {
  if (!orders || orders.length < 2) return "Not enough data to determine a trend.";
  const recentSales = orders.slice(0, 5).reduce((sum, o) => sum + (o.price * o.quantity), 0);
  const olderSales = orders.slice(5).reduce((sum, o) => sum + (o.price * o.quantity), 0);
  const recentAvg = recentSales / Math.min(5, orders.length);
  const olderAvg = olderSales / Math.max(1, orders.length - 5); // Avoid division by zero
  return recentAvg > olderAvg ? "upward" : recentAvg < olderAvg ? "downward" : "stable";
};

// Utility function to find top-selling product from orders
const getTopProduct = (vendor) => {
  if (!vendor || !vendor.orders || vendor.orders.length === 0) return null;
  const productSales = {};
  for (const order of vendor.orders) {
    productSales[order.productName] = (productSales[order.productName] || 0) + order.quantity;
  }
  const topProductName = Object.keys(productSales).reduce(
    (a, b) => (productSales[a] > productSales[b] ? a : b),
    null
  );
  if (!topProductName) return null;
  const product = vendor.products.find((p) => p.name === topProductName);
  return product ? { name: product.name, sales: productSales[topProductName] } : null;
};

// Utility function to find low-stock products
const getLowStockProducts = (products) => {
  if (!products || products.length === 0) return [];
  return products.filter((p) => p.stock < 5).map((p) => `${p.name} (${p.stock} left)`);
};

// Utility function to calculate average order processing time (mocked)
const getAvgOrderProcessingTime = (orders) => {
  if (!orders || orders.length === 0) return "No orders to analyze.";
  const completedOrders = orders.filter((o) => o.status === "Completed");
  if (completedOrders.length === 0) return "No completed orders to analyze.";
  return `${Math.floor(Math.random() * 24) + 1} hours (estimated)`; // Mocked
};

// Utility function to suggest pricing adjustments
const suggestPricing = (products, avgSales) => {
  if (!products || products.length === 0) return "No products to analyze pricing for.";
  const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
  if (avgSales < avgPrice) {
    return "Your average sale is lower than your average price. Consider lowering prices or offering discounts.";
  } else if (avgSales > avgPrice * 2) {
    return "Your average sale is strong! You could try increasing prices slightly on popular items.";
  }
  return "Your pricing seems balanced with your sales. Keep monitoring customer response.";
};

// Utility function to get busiest day (mocked based on orders)
const getBusiestDay = (orders) => {
  if (!orders || orders.length === 0) return "Not enough data yet.";
  const dayCount = {};
  orders.forEach((order) => {
    const day = new Date(order.orderedAt).toLocaleString("en-US", { weekday: "long" });
    dayCount[day] = (dayCount[day] || 0) + order.quantity;
  });
  const busiest = Object.entries(dayCount).reduce(
    (a, b) => (a[1] > b[1] ? a : b),
    ["Unknown", 0]
  );
  return busiest[1] > 0 ? busiest[0] : "Not enough data yet.";
};

// Main AI logic function
const generateResponse = async (message, vendorId) => {
  let vendor;
  let stall;
  try {
    vendor = await Vendor.findById(vendorId);
    stall = await DailyStall.findOne({ vendorID: vendorId });
  } catch (error) {
    return "Sorry, I couldn't fetch your data. Please try again later.";
  }

  if (!vendor) return "Vendor not found. Please check your vendor ID.";

  const orders = vendor.orders || [];
  const products = vendor.products || [];
  const totalSales = orders.reduce((sum, order) => sum + (order.price * order.quantity), 0);
  const avgSales = orders.length > 0 ? totalSales / orders.length : 0;
  const salesTrend = calculateSalesTrend(orders);
  const topProduct = getTopProduct(vendor);
  const lowStockProducts = getLowStockProducts(products);
  const busiestDay = getBusiestDay(orders);

  message = message.toLowerCase().trim();

  // Exact matches for suggested follow-ups first
  if (message === "restocking tips" || message === "restock tips") {
    if (products.length === 0) {
      return "You don't have any products to restock yet. Add some in 'Register Product' first!";
    }
    if (lowStockProducts.length > 0) {
      return `Low-stock items:\n${lowStockProducts.join("\n")}\nRestocking tips:\n` +
             "- Order 10-20 extra units of fast sellers.\n" +
             "- Restock before weekends or events.\n" +
             "- Prioritize your top product to keep sales flowing.\n" +
             "Which item do you want to restock first?";
    }
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    return `You have ${products.length} products with ${totalStock} total units.\n` +
           "Restocking tips:\n" +
           "- Plan based on sales trends (ask 'How are my sales?' for details).\n" +
           "- Stock up before peak seasons or holidays.\n" +
           "- Maintain a buffer of 5+ units per item.\n" +
           "Need help with specific products?";
  }

  if (message === "low stock") {
    if (products.length === 0) {
      return "You don't have any products yet, so nothing's low on stock. Add some in 'Register Product'!";
    }
    if (lowStockProducts.length > 0) {
      return `These products are low on stock:\n${lowStockProducts.join("\n")}\n` +
             "Restock soon to keep sales going! Want restocking tips?";
    }
    return "Good news! None of your products are low on stock (all have 5+ units). Want to check total stock or sales trends?";
  }

  if (message === "sales tips" || message === "boost sales") {
    if (orders.length === 0) {
      return "You haven't made sales yet. Start by adding products and booking a stall!";
    }
    return "To boost your sales:\n" +
           "- Offer discounts on slow-moving items.\n" +
           "- Promote your top product with special offers.\n" +
           "- Book a stall in a high-traffic area.\n" +
           "- Add variety to your inventory.\n" +
           "Which idea do you like?";
  }

  if (message === "stall tips" || message === "location tips") {
    if (!stall) {
      return "You don't have a stall yet. Book one in 'Location Management' for these tips to apply!";
    }
    return "Stall placement tips:\n" +
           "- Near entrances or food courts = more foot traffic.\n" +
           "- Avoid isolated spots unless you're unique.\n" +
           "- Check stall history for busy days.\n" +
           "Want help picking a new spot?";
  }

  // Greeting and Help
  if (message === "hi" || message === "hello" || message === "hey") {
    return "Hello! I'm your VendorSync AI Assistant. How can I assist you today? Ask about sales, stalls, products, orders, licenses, attendance, or anything else!";
  }

  if (message === "help" || message === "what can you do") {
    return "I'm here to assist with your vending business! You can ask about:\n" +
           "- Sales: 'How are my sales?' or 'Sales tips'\n" +
           "- Growth: 'How can I grow my business?'\n" +
           "- Stall: 'Tell me about my stall' or 'Stall tips'\n" +
           "- Products: 'List my products', 'Best-selling product', 'Low stock'\n" +
           "- Orders: 'How many orders do I have?' or 'Pending orders'\n" +
           "- License: 'What's my license status?'\n" +
           "- Attendance: 'Did I mark attendance today?'\n" +
           "- Stock: 'Restocking tips' or 'Low stock'\n" +
           "- Pricing: 'How should I price my products?'\n" +
           "- Profile: 'Show my profile'\n" +
           "- More: 'Peak hours', 'Feedback', 'Trends'\n" +
           "What do you want to explore?";
  }

  // Sales-Related Queries
  if (message.includes("sales")) {
    if (orders.length === 0) {
      return "You haven't made any sales yet. Add products in 'Register Product' and promote them. Need help?";
    }
    const response = `Here's your sales summary:\n` +
                     `- Total sales (last ${orders.length} orders): ₹${totalSales.toFixed(2)}\n` +
                     `- Average sale: ₹${avgSales.toFixed(2)}\n` +
                     `- Sales trend: ${salesTrend}\n` +
                     (topProduct ? `- Top product: ${topProduct.name} (${topProduct.sales} units sold)\n` : "");
    if (message.includes("details") || message.includes("breakdown")) {
      const categorySales = {};
      for (const order of orders) {
        const product = products.find((p) => p.name === order.productName);
        if (product) {
          categorySales[product.category] = (categorySales[product.category] || 0) + (order.price * order.quantity);
        }
      }
      const breakdown = Object.entries(categorySales)
        .map(([cat, amount]) => `- ${cat}: ₹${amount.toFixed(2)}`)
        .join("\n");
      return response + `Sales by category:\n${breakdown || "No category data available."}`;
    }
    return response + "Ask 'sales tips' or 'sales details' for more!";
  }

  // Business Growth Queries
  if (message.includes("grow") || message.includes("business") || message.includes("expand")) {
    if (orders.length === 0) {
      return "You haven't started selling. Steps to grow:\n" +
             "- Book a stall in 'Location Management'.\n" +
             "- Add products in 'Register Product'.\n" +
             "- Mark attendance daily.\n" +
             "Where do you want to begin?";
    }
    if (avgSales < 50) {
      return `Your average sale is ₹${avgSales.toFixed(2)}. Growth ideas:\n` +
             `- Bundle deals (e.g., buy 2 get 1 free).\n` +
             `- Improve product photos.\n` +
             `- Book a busier stall.\n` +
             `- Promote locally.\n` +
             "What's your next move?";
    } else if (avgSales < 100) {
      return `Your average sale is ₹${avgSales.toFixed(2)}. To grow further:\n` +
             `- Add trending products.\n` +
             `- Use signage at your stall.\n` +
             `- Offer loyalty discounts.\n` +
             `- Analyze peak hours.\n` +
             "Which sounds appealing?";
    } else {
      return `Your average sale is ₹${avgSales.toFixed(2)}. Expansion options:\n` +
             `- Add premium items.\n` +
             `- Collaborate with vendors.\n` +
             `- Request a permanent spot.\n` +
             `- Scale inventory for peaks.\n` +
             "What's your goal?";
    }
  }

  // Stall-Related Queries
  if (message.includes("stall") || message.includes("location")) {
    if (!stall) {
      return "No stall booked. Reserve one in 'Location Management'. Want tips?";
    }
    const stallStatus = stall.taken ? "booked" : "available";
    const response = `Your stall: ${stall.name} at (${stall.lat}, ${stall.lng}). Status: ${stallStatus}.\n` +
                     `Booked on: ${stall.bookingTime ? new Date(stall.bookingTime).toLocaleString() : "N/A"}.\n`;
    if (message.includes("unbook") || message.includes("cancel")) {
      return response + "To unbook, go to 'Location Management' and click 'Cancel Reservation'.";
    }
    if (message.includes("type")) {
      return response + `Spot type: ${vendor.spotType}. Want to switch? Ask an admin!`;
    }
    return response + "Ask 'stall tips' or 'unbook stall' for more!";
  }

  // Product-Related Queries
  if (message.includes("product") || message.includes("inventory")) {
    if (products.length === 0) {
      return "No products yet. Add some in 'Register Product'. Need ideas?";
    }
    if (message.includes("best") || message.includes("top")) {
      if (topProduct) {
        return `Best-selling product: ${topProduct.name} (${topProduct.sales} units sold).\n` +
               "Promotion ideas:\n" +
               "- Highlight with a sign.\n" +
               "- Offer bulk discounts.\n" +
               "Want more?";
      }
      return "No sales data for a top product yet. Keep selling!";
    }
    if (message.includes("add") || message.includes("new")) {
      return `You have ${products.length} products. To add:\n` +
             `- Go to 'Register Product'.\n` +
             `- Try seasonal or local items.\n` +
             "What's your next product?";
    }
    if (message.includes("list") || message.includes("show")) {
      const productList = products.map((p) => `- ${p.name} (Price: ₹${p.price}, Stock: ${p.stock}, Category: ${p.category})`).join("\n");
      return `Your products:\n${productList}\nAsk 'low stock' or 'restocking tips'!`;
    }
    if (message.includes("category")) {
      const categories = [...new Set(products.map((p) => p.category))];
      return `Categories: ${categories.join(", ") || "None"}.\nWant to add more?`;
    }
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    return `You have ${products.length} products with ${totalStock} units.\n` +
           "Ask 'list my products', 'best-selling product', 'low stock', or 'restocking tips'!";
  }

  // Order-Related Queries
  if (message.includes("order") || message.includes("orders")) {
    if (orders.length === 0) {
      return "No orders yet. Promote your stall and products to start!";
    }
    const recentOrder = orders[0];
    const response = `You have ${orders.length} orders.\n` +
                     `- Total sales: ₹${totalSales.toFixed(2)}\n` +
                     `- Latest: ${recentOrder.productName} (₹${recentOrder.price * recentOrder.quantity.toFixed(2)}) on ${new Date(recentOrder.orderedAt).toLocaleString()}\n`;
    if (message.includes("pending") || message.includes("status")) {
      const pendingOrders = orders.filter((o) => o.status === "Pending");
      const pendingList = pendingOrders.map((o) => `- ${o.productName} (${o.quantity} units)`).join("\n");
      return response + `Pending orders: ${pendingOrders.length}\n${pendingList || "None"}.\nProcess them in 'Order Management'!`;
    }
    if (message.includes("completed") || message.includes("done")) {
      const completedOrders = orders.filter((o) => o.status === "Completed");
      return response + `Completed orders: ${completedOrders.length}.\nProcessing time: ${getAvgOrderProcessingTime(orders)}`;
    }
    if (message.includes("tips") || message.includes("more")) {
      return response + "To get more orders:\n" +
             "- Offer quick pickup options.\n" +
             "- Promote during peak hours.\n" +
             "- Add popular items.\n" +
             "Which do you like?";
    }
    return response + "Ask 'pending orders', 'completed orders', or 'order tips'!";
  }

  // License-Related Queries
  if (message.includes("license")) {
    const status = vendor.license.status;
    const response = `License status: "${status}".\n`;
    if (status === "not issued") {
      return response + "Apply in 'License Details'. Need Aadhaar, PAN, and photos!";
    } else if (status === "requested") {
      return response + `Applied: ${vendor.license.appliedAt ? new Date(vendor.license.appliedAt).toLocaleString() : "N/A"}.\nCheck 'License Details' for updates!`;
    } else if (status === "completed") {
      return response + `Number: ${vendor.license.licenseNumber || "N/A"}.\nApproved: ${vendor.license.approvedAt ? new Date(vendor.license.approvedAt).toLocaleString() : "N/A"}.\nYou're good to go!`;
    }
    return response + "It's active. Any questions?";
  }

  // Attendance-Related Queries
  if (message.includes("attendance")) {
    const lastAttendance = vendor.lastAttendance ? new Date(vendor.lastAttendance) : null;
    const today = new Date();
    const isToday = lastAttendance &&
                    lastAttendance.getDate() === today.getDate() &&
                    lastAttendance.getMonth() === today.getMonth() &&
                    lastAttendance.getFullYear() === today.getFullYear();
    if (isToday) {
      return `Attendance marked today at ${lastAttendance.toLocaleString()}. Well done!`;
    }
    if (stall && stall.taken && !isToday) {
      return "No attendance today yet. Mark it in 'Dashboard' within 24 hours of booking!";
    }
    if (message.includes("history") || message.includes("past")) {
      return lastAttendance ? `Last attendance: ${lastAttendance.toLocaleString()}.` : "No attendance recorded yet.";
    }
    return "No stall booked, so attendance isn't required.";
  }

  // Pricing-Related Queries
  if (message.includes("price") || message.includes("pricing")) {
    if (products.length === 0) {
      return "No products to price. Add some in 'Register Product'!";
    }
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    const response = `Average price: ₹${avgPrice.toFixed(2)}.\n` +
                     suggestPricing(products, avgSales) + "\n";
    if (message.includes("adjust") || message.includes("change")) {
      return response + "To adjust:\n" +
             "- Lower prices on slow movers.\n" +
             "- Raise prices on high-demand items.\n" +
             "- Test small changes.\n" +
             "Which product to tweak?";
    }
    return response + "Ask 'adjust pricing' for more!";
  }

  // Stock Management Queries
  if (message.includes("stock") && !message.includes("low") && !message.includes("restock")) {
    if (products.length === 0) {
      return "No products in stock yet. Add some in 'Register Product'!";
    }
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    return `You have ${products.length} products with ${totalStock} units.\n` +
           "Ask 'low stock' or 'restocking tips' for details!";
  }

  // Profile-Related Queries
  if (message.includes("profile") || message.includes("my details")) {
    const response = `Your profile:\n` +
                     `- Name: ${vendor.name}\n` +
                     `- Email: ${vendor.email}\n` +
                     `- Vendor ID: ${vendor.shopID}\n` +
                     `- Business: ${vendor.businessName} (${vendor.category})\n` +
                     `- Complete: ${vendor.isProfileComplete ? "Yes" : "No"}\n`;
    if (!vendor.isProfileComplete) {
      return response + "Complete it in 'Vendor Profile' for better visibility!";
    }
    return response + "All set! Want to update anything?";
  }

  // Peak Selling Hours (Mock)
  if (message.includes("peak") || message.includes("busy time")) {
    const mockHours = vendor.peakSellingHours || "12 PM - 3 PM (estimated)";
    return `Peak hours: ${mockHours}.\n` +
           "Tips:\n" +
           "- Stock extra during these times.\n" +
           "- Promote specials.\n" +
           "Want to refine this?";
  }

  // Customer Feedback (Mock)
  if (message.includes("feedback") || message.includes("customers")) {
    if (orders.length === 0) {
      return "No orders yet for feedback. Start selling!";
    }
    return `Based on ${orders.length} orders:\n` +
           `- Customers like ${topProduct ? topProduct.name : "your offerings"}.\n` +
           "Get direct feedback:\n" +
           "- Ask buyers at the stall.\n" +
           "- Offer a discount for input.\n" +
           "Need a feedback question?";
  }

  // Market Trends (Mock)
  if (message.includes("market") || message.includes("trend")) {
    const trendAdvice = salesTrend === "upward"
      ? "Sales are up—stock more top items!"
      : salesTrend === "downward"
      ? "Sales are down—try discounts."
      : "Sales are stable—try new variety.";
    return `Market insight:\n` +
           `- ${trendAdvice}\n` +
           `- Popular: Seasonal goods, crafts.\n` +
           "Want product ideas?";
  }

  // Weather Impact (Mock)
  if (message.includes("weather")) {
    const weather = Math.random() > 0.5 ? "sunny" : "rainy";
    return `Today's weather: ${weather}.\n` +
           (weather === "sunny" ? "Expect traffic—stock up!" : "Rainy—focus on durable goods.") +
           "\nHow can I help you prepare?";
  }

  // Business Tips
  if (message.includes("tip") || message.includes("advice")) {
    const tips = [
      "Mark attendance daily for visibility.",
      "Update product photos.",
      "Chat with me daily for insights!",
      "Ask customers what they want.",
      "Book stalls early for prime spots.",
      "Test a discount on slow days.",
      "Keep your stall tidy!",
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    return `Tip: ${randomTip}\nWant more specific advice?`;
  }

  // Motivation
  if (message.includes("motivate") || message.includes("encourage")) {
    const encouragements = [
      "You're doing great—keep it up!",
      "Your next big sale is coming!",
      "Consistency is your strength!",
      "You're building something awesome!",
      "Small wins lead to big success!",
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }

  // Stall Booking Assistance
  if (message.includes("book") && message.includes("stall")) {
    if (stall) {
      return `You've booked ${stall.name}. Want to change it? Go to 'Location Management'.`;
    }
    return "To book a stall:\n" +
           "- Go to 'Location Management'.\n" +
           "- Pick a spot near busy areas.\n" +
           "Need help choosing?";
  }

  // Order Fulfillment Tips
  if (message.includes("fulfill") || message.includes("delivery")) {
    if (orders.length === 0) {
      return "No orders to fulfill yet. Start selling!";
    }
    return "Fulfillment tips:\n" +
           "- Process fast in 'Order Management'.\n" +
           "- Update stock to avoid overselling.\n" +
           "- Notify customers when ready.\n" +
           "Any issues?";
  }

  // Category Insights
  if (message.includes("category") && !message.includes("product")) {
    return `Category: ${vendor.category}.\n` +
           `Tips for ${vendor.category}:\n` +
           (vendor.category === "Food" ? "- Offer fresh, quick items.\n- Give samples!" :
            vendor.category === "Crafts" ? "- Highlight unique designs.\n- Share their story!" :
            "- Focus on quality and value.\n- Add variety!") +
           "\nWant more strategies?";
  }

  // Emergency Contact
  if (message.includes("emergency") || message.includes("contact")) {
    return `Emergency contact: ${vendor.emergencyContact || "Not set"}.\n` +
           (vendor.emergencyContact ? "All good!" : "Add one in 'Vendor Profile'!");
  }

  // Business Description
  if (message.includes("description") || message.includes("about me")) {
    return `Business description: "${vendor.businessDescription || "Not set"}".\n` +
           (vendor.businessDescription ? "Great!" : "Add one in 'Vendor Profile'!");
  }

  // Busiest Day
  if (message.includes("busiest day") || message.includes("busy day")) {
    return `Your busiest day: ${busiestDay}.\n` +
           "Tips:\n" +
           "- Stock extra on this day.\n" +
           "- Promote specials.\n" +
           "Want more sales insights?";
  }

  // Fallback Response
  return "I'm here to help! Try asking about sales, stalls, products, orders, licenses, attendance, pricing, stock, or anything else. What's on your mind?";
};

// Chatbot Route
router.post("/", protectVendor, async (req, res) => {
  try {
    const { message, vendorId } = req.body;
    if (!message || !vendorId) {
      return res.status(400).json({ message: "Message and vendorId are required" });
    }
    const reply = await generateResponse(message, vendorId);
    res.json({ reply });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;