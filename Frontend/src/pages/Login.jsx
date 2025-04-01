// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("vendor"); // Default to vendor login
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      let url = "http://localhost:5000/api/auth/vendor/login"; // Default vendor login
      let data = { email, password };

      if (role === "admin") {
        url = "http://localhost:5000/api/auth/admin/login";
        data = { username: email, password }; // Admin uses username
      } else if (role === "user") {
        url = "http://localhost:5000/api/auth/user/login";
      }

      const response = await axios.post(url, data);
      login(response.data.token, role); // Save token globally

      alert("Login successful!");
      navigate(
        role === "admin" ? "/admin" : role === "vendor" ? "/vendor" : "/user"
      );
    } catch (error) {
      alert(error.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="container mx-auto max-w-md p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

      {/* Role Selection */}
      <div className="mb-4 flex justify-around">
        <label className="inline-flex items-center">
          <input
            type="radio"
            value="vendor"
            checked={role === "vendor"}
            onChange={() => setRole("vendor")}
            className="form-radio h-5 w-5 text-blue-600"
          />
          <span className="ml-2">Vendor</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            value="user"
            checked={role === "user"}
            onChange={() => setRole("user")}
            className="form-radio h-5 w-5 text-blue-600"
          />
          <span className="ml-2">User</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            value="admin"
            checked={role === "admin"}
            onChange={() => setRole("admin")}
            className="form-radio h-5 w-5 text-blue-600"
          />
          <span className="ml-2">Admin</span>
        </label>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder={role === "admin" ? "Admin Username" : "Email"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Login
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <span
          className="text-blue-500 cursor-pointer hover:underline"
          onClick={() => navigate("/register")}
        >
          Register
        </span>
      </p>
    </div>
  );
};

export default Login;
