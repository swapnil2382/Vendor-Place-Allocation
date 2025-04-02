import React, { useState } from "react";
import axios from "axios";

const ProductForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
  });
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (image) data.append("productImage", image);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please log in.");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/vendors/add-product",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage("Product registered successfully.");
      setError("");
      setFormData({ name: "", description: "", price: "", category: "", stock: "" });
      setImage(null);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to register product."
      );
      setMessage("");
    }
  };

  return (
    <section className="bg-white p-8 rounded-lg shadow-md border border-gray-300 max-w-4xl mx-auto ">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-300 pb-2">
        Register New Product
      </h3>
      {message && (
        <p className="mb-6 text-green-700 bg-green-100 p-3 rounded border border-green-300">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-6 text-red-700 bg-red-100 p-3 rounded border border-red-300">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: Name, Description, Price */}
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-2">
                Product Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50"
                rows="4"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-2">
                Price (₹) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50"
                required
              />
            </div>
          </div>

          {/* Right Column: Category, Stock, Image */}
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-2">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50"
                required
              >
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Food">Food</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full p-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-2">
                Product Image
              </label>
              <input
                type="file"
                onChange={handleImageChange}
                className="w-full p-3 border border-gray-400 rounded text-gray-600 bg-gray-50"
                accept="image/*"
              />
            </div>
          </div>
        </div>

        {/* Submit Button (Centered Below Columns) */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="w-1/2 bg-blue-700 text-white py-3 rounded font-semibold uppercase tracking-wide hover:bg-blue-800 transition-colors border border-blue-800 shadow-sm"
          >
            Register Product
          </button>
        </div>
      </form>
    </section>
  );
};

export default ProductForm;