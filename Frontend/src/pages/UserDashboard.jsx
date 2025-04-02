// frontend/src/pages/UserDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserProductList from "../components/Userproductlist"; // Corrected case
import Cart from "../components/Cart";
import UserOrderHistory from "../components/UserOrderHistory";

const UserDashboard = () => {
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState("products");
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    console.log("UserDashboard - Context token:", token, "Stored token:", storedToken);
    if (!token && !storedToken) {
      console.log("No token found, redirecting to /login");
      navigate("/login");
    }
  }, [token, navigate]);

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item._id === product._id);
    if (existingItem) {
      setCart(cart.map((item) =>
        item._id === product._id && item.quantity < item.stock
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateCart = (updatedCart) => {
    setCart(updatedCart);
  };

  const removeFromCart = (productId) => {
    if (productId === null) setCart([]); // Clear cart on buy
    else setCart(cart.filter((item) => item._id !== productId));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
      <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded mb-4">
        Logout
      </button>
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${activeTab === "products" ? "border-b-2 border-blue-500" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "orders" ? "border-b-2 border-blue-500" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Order History
        </button>
      </div>
      <div className="flex">
        <div className="w-3/4">
          {activeTab === "products" && <UserProductList addToCart={addToCart} />}
          {activeTab === "orders" && <UserOrderHistory />}
        </div>
        {activeTab === "products" && (
          <div className="w-1/4 ml-4">
            <Cart cart={cart} updateCart={updateCart} removeFromCart={removeFromCart} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;