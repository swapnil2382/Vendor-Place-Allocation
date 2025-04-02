// frontend/src/components/Cart.jsx
import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Cart = ({ cart, updateCart, removeFromCart }) => {
  const { token, logout } = useAuth(); // Assuming logout is provided by AuthContext
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const increaseQuantity = (productId) => {
    updateCart(
      cart.map((item) =>
        item._id === productId && item.quantity < item.stock
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (productId) => {
    updateCart(
      cart.map((item) =>
        item._id === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const handleBuyNow = async () => {
    if (cart.length === 0) {
      setError("Your cart is empty. Add items before placing an order.");
      return;
    }

    try {
      const orderData = cart.map((item) => ({
        productId: item._id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      await axios.post(
        "http://localhost:5000/api/users/orders",
        { items: orderData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowModal(false);
      removeFromCart(null); // Clear cart
      alert("Order placed successfully!"); // Replace with toast in production
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      setError(`Failed to place order: ${message}`);
      if (error.response?.status === 401) {
        logout(); // Log out on unauthorized access
      }
    }
  };

  const openOrderModal = () => {
    if (cart.length === 0) {
      setError("Your cart is empty. Add items before placing an order.");
    } else {
      setError(null);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Shopping Cart</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6" role="alert">
          <p>{error}</p>
          {error.includes("empty") && (
            <p className="text-sm mt-2">Please add items to your cart to proceed.</p>
          )}
        </div>
      )}

      {cart.length === 0 ? (
        <p className="text-gray-600 text-center py-10">
          Your cart is empty. Start shopping to add items.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold">Product</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Unit Price</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Quantity</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Subtotal</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Stock</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr
                  key={item._id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-800">{item.name}</td>
                  <td className="py-3 px-4 text-gray-600">₹{item.price.toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => decreaseQuantity(item._id)}
                        className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => increaseQuantity(item._id)}
                        className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        disabled={item.quantity >= item.stock}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-green-600 font-semibold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{item.stock}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-between items-center">
            <p className="text-lg font-bold text-gray-800">
              Total: <span className="text-green-600">₹{totalPrice.toFixed(2)}</span>
            </p>
            <button
              onClick={openOrderModal}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Place Order
            </button>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Order</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to place this order for a total of ₹{totalPrice.toFixed(2)}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Cancel order placement"
              >
                Cancel
              </button>
              <button
                onClick={handleBuyNow}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Confirm order placement"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;