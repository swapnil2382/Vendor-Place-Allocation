// frontend/src/components/ProductList.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const { token, logout } = useAuth(); // Assuming logout is provided by AuthContext

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://localhost:5000/api/vendors/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      setError(`Failed to load products: ${message}`);
      if (error.response?.status === 401) {
        logout(); // Log out on unauthorized access
      }
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`http://localhost:5000/api/vendors/delete-product/${productToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((product) => product._id !== productToDelete));
      setShowModal(false);
      setProductToDelete(null);
      alert("Product deleted successfully"); // Replace with toast notification in production
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      setError(`Failed to delete product: ${message}`);
      if (error.response?.status === 401) {
        logout();
      }
      setShowModal(false);
    }
  };

  const openDeleteModal = (productId) => {
    setProductToDelete(productId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setProductToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-700">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
        <p>{error}</p>
        <button
          onClick={fetchProducts}
          className="mt-2 text-sm underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Vendor Product Inventory</h1>

      {products.length === 0 ? (
        <p className="text-gray-600 text-center py-10">No products available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold">Image</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Name</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Description</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Price</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Category</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Stock</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product._id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-gray-500">No Image</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-800">{product.name}</td>
                  <td className="py-3 px-4 text-gray-600">{product.description}</td>
                  <td className="py-3 px-4 text-green-600 font-semibold">₹{product.price}</td>
                  <td className="py-3 px-4 text-gray-600">{product.category}</td>
                  <td className="py-3 px-4 text-gray-600">{product.stock}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openDeleteModal(product._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Delete ${product.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Confirm deletion"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;