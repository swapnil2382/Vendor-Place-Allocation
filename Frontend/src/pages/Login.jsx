// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const url = isAdmin
        ? "http://localhost:5000/api/auth/admin/login"
        : "http://localhost:5000/api/auth/vendor/login";
      const data = isAdmin
        ? { username: email, password }
        : { email, password };

      const response = await axios.post(url, data);
      login(response.data.token, isAdmin ? "admin" : "vendor");

      alert("Login successful!");
      navigate(isAdmin ? "/admin-dashboard" : "/vendor-dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <label>
        <input
          type="checkbox"
          checked={isAdmin}
          onChange={() => setIsAdmin(!isAdmin)}
        />
        Admin Login
      </label>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder={isAdmin ? "Admin Username" : "Email"}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p className="mt-3 text-sm">
        Don’t have an account?{" "}
        <span
          className="text-blue-500 cursor-pointer underline"
          onClick={() => navigate("/register")}
        >
          Register
        </span>
      </p>
    </div>
  );
};

export default Login;
