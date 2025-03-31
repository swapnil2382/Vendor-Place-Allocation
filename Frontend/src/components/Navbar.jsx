// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      console.log("Token in Navbar:", token);
      if (!token) return;

      try {
        const res = await axios.get("http://localhost:5000/api/vendors/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err.response?.data || err);
      }
    };
    fetchUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-bold">
          Market App
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-white">
                Welcome, {user.name || "Vendor"}
              </span>
              <Link
                to="/vendor-dashboard"
                className="text-white hover:underline"
              >
                Dashboard
              </Link>
              <Link to="/places" className="text-white hover:underline">
                Find Spaces
              </Link>
              <button onClick={logout} className="text-white hover:underline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white hover:underline">
                Login
              </Link>
              <Link to="/register" className="text-white hover:underline">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
