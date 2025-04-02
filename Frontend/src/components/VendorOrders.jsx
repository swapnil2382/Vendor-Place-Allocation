// frontend/src/components/VendorOrders.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/vendors/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch orders: " + (err.response?.data?.message || err.message));
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
      setOrders(orders.map((order) =>
        order._id === orderId ? { ...order, status: "Completed" } : order
      ));
    } catch (err) {
      setError("Failed to complete order: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <p className="text-center text-gray-600">Loading orders...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">My Orders</h3>
      {orders.length === 0 ? (
        <p className="text-gray-600">No orders yet.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li
              key={order._id}
              className="flex justify-between items-center p-3 bg-gray-100 rounded-lg"
            >
              <div>
                <p><strong>Product:</strong> {order.productName}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>
                <p><strong>Price:</strong> ₹{order.price}</p>
                <p><strong>User:</strong> {order.userId?.username || "Unknown"}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Ordered At:</strong> {new Date(order.orderedAt).toLocaleString()}</p>
              </div>
              {order.status === "Pending" && (
                <button
                  onClick={() => handleCompleteOrder(order._id)}
                  className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  ✓ Complete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VendorOrders;