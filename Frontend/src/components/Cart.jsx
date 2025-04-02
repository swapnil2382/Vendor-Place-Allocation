// frontend/src/components/Cart.jsx
import React from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Cart = ({ cart, updateCart, removeFromCart }) => {
  const { token } = useAuth();
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const increaseQuantity = (productId) => {
    updateCart(cart.map((item) =>
      item._id === productId && item.quantity < item.stock
        ? { ...item, quantity: item.quantity + 1 }
        : item
    ));
  };

  const decreaseQuantity = (productId) => {
    updateCart(cart.map((item) =>
      item._id === productId && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    ));
  };

  const handleBuyNow = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    console.log("Buy Now clicked, token:", token); // Debug token
    try {
      const orderData = cart.map((item) => ({
        productId: item._id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
      console.log("Sending order data:", orderData);

      const response = await axios.post(
        "http://localhost:5000/api/users/orders",
        { items: orderData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Order placed:", response.data);
      alert("Order placed successfully!");
      removeFromCart(null);
    } catch (error) {
      console.error("Error placing order:", error.response?.data || error.message);
      alert("Failed to place order: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="p-4 border rounded shadow-lg">
      <h2 className="text-xl font-bold">Shopping Cart</h2>
      {cart.length === 0 ? (
        <p>No items in cart.</p>
      ) : (
        <>
          <ul>
            {cart.map((item) => (
              <li key={item._id} className="flex justify-between items-center border-b py-2">
                <div>
                  {item.name} - ${item.price} x {item.quantity}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => decreaseQuantity(item._id)}
                    className="bg-gray-300 px-2 py-1 rounded"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => increaseQuantity(item._id)}
                    className="bg-gray-300 px-2 py-1 rounded"
                    disabled={item.quantity >= item.stock}
                  >
                    +
                  </button>
                  <button
                    className="text-red-500"
                    onClick={() => removeFromCart(item._id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="font-bold mt-2">Total: ${totalPrice.toFixed(2)}</p>
          <button
            onClick={handleBuyNow}
            className="bg-green-500 text-white px-4 py-1 rounded mt-2 hover:bg-green-600"
          >
            Buy Now
          </button>
        </>
      )}
    </div>
  );
};

export default Cart;