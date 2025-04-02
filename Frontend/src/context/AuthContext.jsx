// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Change to named import

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthContext - Token updated:", token, "Role:", role);
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      try {
        const decoded = jwtDecode(token); // Still works with named import
        fetchUserData(decoded.id, token);
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      setUser(null);
    }
  }, [token, role]);

  const fetchUserData = async (userId, authToken) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const userData = await response.json();
      setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(null);
    }
  };

  const login = (newToken, newRole, userData = null) => {
    console.log("Logging in - Token:", newToken, "Role:", newRole);
    setToken(newToken);
    setRole(newRole);
    if (userData) {
      setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
      });
    }
  };

  const logout = () => {
    console.log("Logging out");
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("cart");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);