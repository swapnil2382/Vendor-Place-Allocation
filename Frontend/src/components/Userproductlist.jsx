// frontend/src/components/UserProductList.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const UserProductList = ({ addToCart, cartCount }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/users/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error.response?.data || error.message);
        setLoading(false);
      }
    };
    if (token) fetchProducts();
  }, [token]);

  if (loading) return <p className="text-center text-gray-500">Loading products...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Available Products</h2>
        <span className="text-sm text-gray-600">
          Items in cart: {cartCount}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div 
            key={product._id} 
            className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover mb-3 rounded"
              />
            )}
            <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
            <p className="text-gray-600 mb-2 line-clamp-2">{product.description}</p>
            <div className="flex justify-between items-center mb-2">
              <p className="text-green-600 font-bold">${product.price}</p>
              <p className="text-sm text-gray-500">Stock: {product.stock}</p>
            </div>
            <p className="text-sm text-gray-500 mb-3">Category: {product.category}</p>
            <button
              onClick={() => addToCart(product)}
              className={`w-full py-2 rounded transition-colors ${
                product.stock === 0 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProductList;