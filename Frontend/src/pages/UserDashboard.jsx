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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!token && !storedToken) {
      navigate("/login");
    }
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [token, navigate]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item._id === product._id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === product._id && item.quantity < item.stock
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateCart = (updatedCart) => {
    setCart(updatedCart);
  };

  const removeFromCart = (productId) => {
    if (productId === null) setCart([]);
    else setCart(cart.filter((item) => item._id !== productId));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xl font-semibold text-gray-700">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                <p className="font-semibold">{user?.username || "User"}</p>
                <p className="text-gray-500">{user?.email || "No email"}</p>
                <p className="text-gray-500">{user?.phone || "No phone"}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsDropdownOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-100 rounded-lg p-1 mb-6">
        <div className="flex">
          {["products", "cart", "orders"].map((tab) => (
            <button
              key={tab}
              className={`flex-1 px-6 py-2 capitalize relative rounded-md ${
                activeTab === tab
                  ? "bg-white text-blue-600 font-semibold shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "cart" && cart.length > 0 && (
                <span className="absolute top-0 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
              {tab}
            </button>
          ))}
        </div>
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