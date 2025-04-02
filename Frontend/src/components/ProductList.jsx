import React, { useState, useEffect } from "react";
import axios from "axios";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/vendors/products",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error retrieving products:", error);
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to remove this product?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `http://localhost:5000/api/vendors/delete-product/${productId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProducts(products.filter((product) => product._id !== productId));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  if (loading)
    return (
      <p className="text-center text-gray-600 text-lg">
        Retrieving product inventory...
      </p>
    );

  return (
    <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Product Inventory
      </h3>
      {products.length === 0 ? (
        <p className="text-gray-600">No products registered.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h4 className="text-lg font-semibold text-gray-800">
                {product.name}
              </h4>
              <p className="text-gray-600">{product.description}</p>
              <p className="text-blue-700 font-medium mt-2">
                ₹{product.price}
              </p>
              <p className="text-gray-700">
                <strong>Category:</strong> {product.category}
              </p>
              <p className="text-gray-700">
                <strong>Stock:</strong> {product.stock}
              </p>
              <button
                onClick={() => handleDelete(product._id)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
              >
                Remove Product
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductList;