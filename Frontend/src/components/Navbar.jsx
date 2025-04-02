// frontend/src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

function Navbar() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("role")); // Initialize from localStorage
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token || !role) return;

      try {
        let res;
        if (role === "vendor") {
          res = await axios.get(
            `http://localhost:5000/api/vendors/me?lang=${i18n.language}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } else if (role === "user") {
          res = await axios.get(
            `http://localhost:5000/api/users/me?lang=${i18n.language}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } else if (role === "admin") {
          // Add admin endpoint if needed
          return;
        }
        if (res?.data) {
          setUser(res.data);
          console.log("User fetched for Navbar:", res.data); // Debugging
        }
      } catch (err) {
        console.error(
          "Error fetching user:",
          err.response?.data || err.message
        );
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setUser(null);
          setRole(null);
          navigate("/login");
        }
      }
    };

    fetchUser();
  }, [role, i18n.language, navigate]); // Added navigate to dependency array

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    setRole(null);
    navigate("/");
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nLng", lng); // Persist language choice
  };

  // Load saved language on mount
  useEffect(() => {
    const savedLng = localStorage.getItem("i18nLng");
    if (savedLng) i18n.changeLanguage(savedLng);
  }, [i18n]);

  return (
    <nav className="bg-blue-600 p-4 flex justify-between items-center">
      <h1 className="text-white text-2xl font-bold">{t("app_name")}</h1>

      <div className="flex items-center gap-4">
        {role ? (
          <>
            {role === "admin" ? (
              <span className="text-white font-bold">{t("ind_govt")}</span>
            ) : (
              <div className="flex items-center gap-4">
                {role === "vendor" && (
                  <>
                    <Link to="/vendor" className="text-white hover:underline">
                      {t("home")}
                    </Link>
                    <Link
                      to="/vendor/location"
                      className="text-white hover:underline"
                    >
                      {t("location")}
                    </Link>
                    <Link
                      to="/vendor/products"
                      className="text-white hover:underline"
                    >
                      {t("products")}
                    </Link>
                    <Link
                      to="/vendor/orders"
                      className="text-white hover:underline"
                    >
                      {t("orders")}
                    </Link>
                    <Link
                      to="/vendor/license"
                      className="text-white hover:underline"
                    >
                      {t("license")}
                    </Link>
                    <Link to="/places" className="text-white hover:underline">
                      {t("place")}
                    </Link>
                  </>
                )}
                {role === "user" && (
                  <>
                    <Link to="/user" className="text-white hover:underline">
                      {t("home")}
                    </Link>
                    <Link to="/cart" className="text-white hover:underline">
                      {t("cart")}
                    </Link>
                  </>
                )}
                <span className="text-white">
                  {user?.name || user?.username || "User"}
                </span>
                <img
                  src="https://via.placeholder.com/40"
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
              </div>
            )}

            {/* Language Dropdown */}
            <div className="relative group">
              <button className="text-white px-2 py-1 rounded bg-blue-700 hover:bg-blue-800">
                {t("language")}
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-white rounded shadow-lg hidden group-hover:block">
                <button
                  onClick={() => changeLanguage("en")}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  {t("english")}
                </button>
                <button
                  onClick={() => changeLanguage("hi")}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  {t("hindi")}
                </button>
                <button
                  onClick={() => changeLanguage("ta")}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  {t("tamil")}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              {t("logout")}
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-white text-blue-600 px-4 py-2 rounded"
          >
            {t("login")}
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
