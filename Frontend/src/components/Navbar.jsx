import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

function Navbar() {
  const { t } = useTranslation(); // Keep translation support, but remove language switcher
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
          res = await axios.get("http://localhost:5000/api/vendors/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else if (role === "user") {
          res = await axios.get("http://localhost:5000/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else if (role === "admin") {
          // Minimal admin fetch, assuming name is available
          res = { data: { name: "Administrator" } }; // Placeholder; replace with actual endpoint if needed
        }
        if (res?.data) {
          setUser(res.data);
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
  }, [role, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    setRole(null);
    navigate("/");
  };

  return (
    <nav className="bg-blue-900 p-4 flex justify-between items-center shadow-md">
      {/* Left Side: App Name */}
      <h1 className="text-white text-2xl font-semibold tracking-wide">
        {t("app_name")}
      </h1>

      {/* Right Side: User Info or Login */}
      <div className="flex items-center gap-6">
        {role && user ? (
          <>
            {/* Display only the user's name */}
            <span className="text-white text-lg font-medium">
              {user.name || user.username || "User"}
            </span>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 transition-colors"
            >
              {t("logout")}
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-white text-blue-900 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            {t("login")}
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;