// frontend/src/components/UserOrderHistory.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const UserOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/users/my-orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Orders fetched for user:", response.data);
        setOrders(response.data);
        setLoading(false);
      } catch (error) {
        setError("Error fetching orders: " + (error.response?.data?.message || error.message));
        console.error("Fetch error:", error.response?.data || error);
        setLoading(false);
      }
    };
    if (token) fetchOrders();
  }, [token]);

  if (loading) return <p>Loading order history...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Order History</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order._id} className="p-3 bg-gray-100 rounded-lg">
              <p><strong>Product:</strong> {order.productName}</p>
              <p><strong>Quantity:</strong> {order.quantity}</p>
              <p><strong>Price:</strong> ${order.price}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Ordered At:</strong> {new Date(order.orderedAt).toLocaleString()}</p>
              <p><strong>Vendor:</strong> {order.vendorId?.businessName || "Unknown"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserOrderHistory;