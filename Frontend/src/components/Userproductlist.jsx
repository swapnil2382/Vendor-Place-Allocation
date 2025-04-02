// frontend/src/components/UserProductList.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const UserProductList = ({ addToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/users/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Products fetched for user:", response.data);
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error.response?.data || error.message);
        setLoading(false);
      }
    };
    if (token) fetchProducts();
  }, [token]);

  if (loading) return <p>Loading products...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product._id} className="border p-4 rounded shadow">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover mb-2"
            />
          )}
          <h3 className="text-xl font-semibold">{product.name}</h3>
          <p className="text-gray-600">{product.description}</p>
          <p className="text-green-600 font-bold">${product.price}</p>
          <p>Category: {product.category}</p>
          <p>Stock: {product.stock}</p>
          <button
            onClick={() => addToCart(product)}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={product.stock === 0}
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
};

export default UserProductList;