// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("vendor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Handle form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }
    if (role !== "admin" && !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
   

    try {
      const url =
        role === "admin"
          ? "http://localhost:5000/api/auth/admin/login"
          : role === "vendor"
          ? "http://localhost:5000/api/auth/vendor/login"
          : "http://localhost:5000/api/auth/user/login";

      const data =
        role === "admin" ? { username: email, password } : { email, password };

      const response = await axios.post(url, data);
      const { token } = response.data;

      login(token, role);
      setSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        navigate(
          role === "admin" ? "/admin" : role === "vendor" ? "/vendor" : "/user",
          { replace: true }
        );
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold text-gray-800">Log In</h2>
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
          <label className="block text-gray-700 font-medium mb-2">Select Role</label>
          <div className="flex gap-6">
            {["vendor", "user", "admin"].map((r) => (
              <label key={r} className="flex items-center">
                <input
                  type="radio"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  disabled={loading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700 capitalize">{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              {role === "admin" ? "Username" : "Email"}
            </label>
            <input
              type={role === "admin" ? "text" : "email"}
              placeholder={role === "admin" ? "Admin Username" : "Email Address"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div>
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
                  Logging in...
                </span>
              ) : (
                "Log In"
              )}
            </button>
          </div>
        </form>

        {/* Register Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <span
            onClick={() => !loading && navigate("/register")}
            className={`${
              loading ? "text-gray-400" : "text-blue-600 hover:underline cursor-pointer"
            }`}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;