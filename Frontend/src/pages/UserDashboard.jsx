// frontend/src/pages/UserDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserProductList from "../components/UserProductList";
import Cart from "../components/Cart";
import UserOrderHistory from "../components/UserOrderHistory";

const UserDashboard = () => {
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState("products");
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!token && !storedToken) {
      navigate("/login");
    }
    // Load cart from localStorage on initial render
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [token, navigate]);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

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
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <button 
          onClick={logout} 
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="flex border-b mb-6">
        {["products", "cart", "orders"].map((tab) => (
          <button
            key={tab}
            className={`px-6 py-2 capitalize relative ${
              activeTab === tab 
                ? "border-b-2 border-blue-500 text-blue-600 font-semibold" 
                : "text-gray-600 hover:text-blue-500"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "cart" && cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {cart.length}
              </span>
            )}
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === "products" && (
          <UserProductList addToCart={addToCart} cartCount={cart.length} />
        )}
        {activeTab === "cart" && (
          <Cart 
            cart={cart} 
            updateCart={updateCart} 
            removeFromCart={removeFromCart}
          />
        )}
        {activeTab === "orders" && <UserOrderHistory />}
      </div>
    </div>
  );
};

export default UserDashboard;