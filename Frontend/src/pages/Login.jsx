import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; // Import useAuth

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("vendor"); // Default to vendor login
  const navigate = useNavigate();
  const { login } = useAuth(); // Use AuthContext

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
        role === "admin" ? "/admin" :
        role === "vendor" ? "/vendor" :
        "/user"
      );
    } catch (error) {
      alert(error.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>

      {/* Role Selection */}
      <div className="role-selection">
        <label>
          <input
            type="radio"
            value="vendor"
            checked={role === "vendor"}
            onChange={() => setRole("vendor")}
          />
          Vendor
        </label>
        <label>
          <input
            type="radio"
            value="user"
            checked={role === "user"}
            onChange={() => setRole("user")}
          />
          User
        </label>
        <label>
          <input
            type="radio"
            value="admin"
            checked={role === "admin"}
            onChange={() => setRole("admin")}
          />
          Admin
        </label>
      </div>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder={role === "admin" ? "Admin Username" : "Email"}
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

      {/* Small text for registration */}
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
