// frontend/src/components/UserOrderHistory.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const UserOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, logout } = useAuth(); // Assuming logout is provided by AuthContext

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://localhost:5000/api/users/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Orders fetched for user:", response.data);
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      setError(`Failed to load order history: ${message}`);
      if (error.response?.status === 401) {
        logout(); // Log out on unauthorized access
      }
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-700">Loading order history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
        <p>{error}</p>
        <button
          onClick={fetchOrders}
          className="mt-2 text-sm underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Order History</h1>

      {orders.length === 0 ? (
        <p className="text-gray-600 text-center py-10">
          No orders found. Start shopping to view your order history.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold">Image</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Product</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Quantity</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Unit Price</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Total</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Ordered</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Vendor</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Status</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Order ID</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    {order.product?.image ? (
                      <img
                        src={order.product.image}
                        alt={order.productName}
                        className="w-16 h-16 object-cover rounded"
                        loading="lazy"
                      />
                    ) : (
                      <img
                        src="https://via.placeholder.com/150?text=No+Image"
                        alt="No Image Available"
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-800">{order.productName}</td>
                  <td className="py-3 px-4 text-gray-600">{order.quantity}</td>
                  <td className="py-3 px-4 text-gray-600">₹{order.price.toFixed(2)}</td>
                  <td className="py-3 px-4 text-green-600 font-semibold">
                  ₹{(order.price * order.quantity).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(order.orderedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {order.vendorId?.businessName || "Unknown"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{order._id.slice(-6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserOrderHistory;