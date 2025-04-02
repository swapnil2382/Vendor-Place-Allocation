import React, { useState, useEffect } from "react";
import axios from "axios";

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState("Pending"); // Default expanded category

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please log in.");
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/vendors/orders",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        setError(
          "Unable to retrieve orders: " +
            (err.response?.data?.message || err.message)
        );
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleCompleteOrder = async (orderId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `http://localhost:5000/api/vendors/orders/${orderId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: "Completed" } : order
        )
      );
    } catch (err) {
      setError(
        "Failed to update order status: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // Group orders by status
  const groupedOrders = orders.reduce(
    (acc, order) => {
      acc[order.status] = acc[order.status] || [];
      acc[order.status].push(order);
      return acc;
    },
    { Pending: [], Completed: [] }
  );

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  if (loading)
    return (
      <p className="text-center text-gray-600 text-lg">
        Retrieving order details...
      </p>
    );
  if (error)
    return (
      <p className="text-red-600 bg-red-100 p-4 rounded text-center">{error}</p>
    );

  return (
    <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 font-sans">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        Order Management
      </h3>

      {orders.length === 0 ? (
        <p className="text-gray-600 text-center">
          No orders currently registered.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Categories: Pending and Completed */}
          {["Pending", "Completed"].map((category) => (
            <div key={category} className="border border-gray-200 rounded-lg">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex justify-between items-center p-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-t-lg focus:outline-none transition-colors"
              >
                <span>
                  {category} Orders ({groupedOrders[category].length})
                </span>
                <span
                  className={`transform transition-transform ${
                    expandedCategory === category ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {/* Collapsible Content */}
              {expandedCategory === category && groupedOrders[category].length > 0 && (
                <div className="p-4">
                  <table className="w-full text-left text-gray-700">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-3 px-4 font-medium">Product</th>
                        <th className="py-3 px-4 font-medium">Quantity</th>
                        <th className="py-3 px-4 font-medium">Price (₹)</th>
                        <th className="py-3 px-4 font-medium">Purchaser</th>
                        <th className="py-3 px-4 font-medium">Order Date</th>
                        {category === "Pending" && (
                          <th className="py-3 px-4 font-medium">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {groupedOrders[category].map((order) => (
                        <tr
                          key={order._id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4">{order.productName}</td>
                          <td className="py-3 px-4">{order.quantity}</td>
                          <td className="py-3 px-4">₹{order.price}</td>
                          <td className="py-3 px-4">
                            {order.userId?.username || "Unknown"}
                          </td>
                          <td className="py-3 px-4">
                            {new Date(order.orderedAt).toLocaleDateString()}
                          </td>
                          {category === "Pending" && (
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleCompleteOrder(order._id)}
                                className="bg-blue-700 text-white px-3 py-1 rounded font-medium hover:bg-blue-800 transition-colors"
                              >
                                Mark Completed
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {expandedCategory === category && groupedOrders[category].length === 0 && (
                <p className="p-4 text-gray-600 text-center">
                  No {category.toLowerCase()} orders at this time.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default VendorOrders;