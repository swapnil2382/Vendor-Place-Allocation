// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

const Register = () => {
  const { t, i18n } = useTranslation();
  const [role, setRole] = useState("user");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    aadhaarID: "",
    category: "",
    location: "",
    businessName: "",
    panNumber: "",
    shopPhoto: "",
    vendorPhoto: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = role === "vendor" ? "/register/vendor" : "/register/user";
    const payload =
      role === "vendor"
        ? {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            aadhaarID: formData.aadhaarID,
            category: formData.category,
            location: formData.location,
            businessName: formData.businessName,
            panNumber: formData.panNumber,
            shopPhoto: formData.shopPhoto,
            vendorPhoto: formData.vendorPhoto,
          }
        : {
            username: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
          };

    try {
      const response = await axios.post(
        `http://localhost:5000/api/auth${endpoint}?lang=${i18n.language}`,
        payload
      );
      const token = response.data.token;
      if (token) localStorage.setItem("token", token);
      alert(response.data.message);
      navigate(role === "vendor" ? "/vendor-dashboard" : "/login");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed";
      setError(errorMessage);
      alert(t("error", { message: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          {t("register_as", {
            role: role === "vendor" ? t("vendor") : t("user"),
          })}
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="flex justify-center space-x-4 mb-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="role"
              value="user"
              checked={role === "user"}
              onChange={() => setRole("user")}
              className="mr-2"
            />
            {t("user")}
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="role"
              value="vendor"
              checked={role === "vendor"}
              onChange={() => setRole("vendor")}
              className="mr-2"
            />
            {t("vendor")}
          </label>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {role === "vendor" ? (
            <>
              <div>
                <label className="block text-gray-700">{t("name")}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("name")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">{t("email")}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("email")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">{t("password")}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t("password")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">{t("phone")}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t("phone")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">{t("aadhaarID")}</label>
                <input
                  type="text"
                  name="aadhaarID"
                  value={formData.aadhaarID}
                  onChange={handleChange}
                  placeholder={t("aadhaarID")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">{t("category")}</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder={t("category")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  {t("location_shop")}
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={t("location_shop")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  {t("businessName")}
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder={t("businessName")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">{t("panNumber")}</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  placeholder={t("panNumber")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">{t("shopPhoto")}</label>
                <input
                  type="text"
                  name="shopPhoto"
                  value={formData.shopPhoto}
                  onChange={handleChange}
                  placeholder={t("shopPhoto")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  {t("vendorPhoto")}
                </label>
                <input
                  type="text"
                  name="vendorPhoto"
                  value={formData.vendorPhoto}
                  onChange={handleChange}
                  placeholder={t("vendorPhoto")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-gray-700">{t("name")}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("name")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">{t("email")}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("email")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">{t("password")}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t("password")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">{t("phone")}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t("phone")}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2 rounded-md text-white ${
              loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? t("registering") : t("register")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
