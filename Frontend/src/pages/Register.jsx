
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
    shopPhoto: null,
    vendorPhoto: null,
  });
  const [photoPreviews, setPhotoPreviews] = useState({
    shopPhoto: null,
    vendorPhoto: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

 
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError(t("file_too_large", { size: "2MB" }));
        return;
      }
      setFormData({ ...formData, [name]: file });
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreviews((prev) => ({ ...prev, [name]: previewUrl }));
    }
  };


  const validateForm = () => {
    const { name, email, password, phone } = formData;
    if (!name || !email || !password || !phone) {
      setError(t("fill_all_fields"));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t("invalid_email"));
      return false;
    }
    if (password.length < 8) {
      setError(t("password_too_short_gov", { min: 8 }));
      return false;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError(t("invalid_phone"));
      return false;
    }
    if (role === "vendor") {
      const { aadhaarID, category, location, businessName, panNumber, shopPhoto, vendorPhoto } = formData;
      if (!aadhaarID || !category || !location || !businessName || !panNumber || !shopPhoto || !vendorPhoto) {
        setError(t("fill_all_fields"));
        return false;
      }
      if (!/^\d{12}$/.test(aadhaarID)) {
        setError(t("invalid_aadhaar"));
        return false;
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        setError(t("invalid_pan"));
        return false;
      }
    }
    return true;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const endpoint = role === "vendor" ? "/register/vendor" : "/register/user";
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) formDataToSend.append(key, value);
    });
    if (role !== "vendor") formDataToSend.set("username", formData.name);

    const url = `http://localhost:5000/api/auth${endpoint}?lang=${i18n.language}`;

    try {
      const response = await axios.post(url, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const token = response.data.token;
      if (token) localStorage.setItem("token", token);

      setSuccess(t("registration_success"));
      setTimeout(() => {
        navigate(role === "vendor" ? "/vendor-dashboard" : "/login", { replace: true });
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || t("registration_failed");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold text-gray-800">
            {t("register", )}
          </h2>
          <img
            src="https://tse2.mm.bing.net/th?id=OIP.alzrYM2sQ2V2On8TxtrsywHaHa&pid=Api&P=0&h=180" // Replace with actual government emblem URL
           
            alt="Government Emblem"
            className="w-12 h-12"
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 border-l-4 border-green-500 rounded">
            {success}
          </div>
        )}

        {/* Role Selection */}
        <div className="mb-6">
         
          <div className="flex gap-6">
            {["user", "vendor"].map((r) => (
              <label key={r} className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  disabled={loading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">{t(r)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">{t("name")}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t("name")}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">{t("email")}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t("email")}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">{t("password")}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t("password")}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">{t("phone")}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit number"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {role === "vendor" && (
              <>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">{t("aadhaarID")}</label>
                  <input
                    type="text"
                    name="aadhaarID"
                    value={formData.aadhaarID}
                    onChange={handleChange}
                    placeholder="12-digit Aadhaar ID"
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">{t("category")}</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder={t("category")}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">{t("location_shop")}</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder={t("location_shop")}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">{t("businessName")}</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder={t("businessName")}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">{t("panNumber")}</label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    placeholder="e.g., ABCDE1234F"
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">{t("shopPhoto")}</label>
                  <input
                    type="file"
                    name="shopPhoto"
                    onChange={handleFileChange}
                    accept="image/*"
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:bg-gray-100"
                  />
                  {photoPreviews.shopPhoto && (
                    <img
                      src={photoPreviews.shopPhoto}
                      alt="Shop Preview"
                      className="mt-2 w-32 h-32 object-cover rounded-md border border-gray-300"
                    />
                  )}
                  <p className="text-sm text-gray-500 mt-1">{t("max_file_size", { size: "2MB" })}</p>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">{t("vendorPhoto")}</label>
                  <input
                    type="file"
                    name="vendorPhoto"
                    onChange={handleFileChange}
                    accept="image/*"
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:bg-gray-100"
                  />
                  {photoPreviews.vendorPhoto && (
                    <img
                      src={photoPreviews.vendorPhoto}
                      alt="Vendor Preview"
                      className="mt-2 w-32 h-32 object-cover rounded-md border border-gray-300"
                    />
                  )}
                  <p className="text-sm text-gray-500 mt-1">{t("max_file_size", { size: "2MB" })}</p>
                </div>
              </>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-md text-white font-medium transition-colors duration-200 ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z"
                  />
                </svg>
                {t("registering")}
              </span>
            ) : (
              t("register")
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          {t("Already Register.")}{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            {t("login")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;