import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [role, setRole] = useState("user"); // Default role is "user"
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    aadhaarID: "",
    category: "",
    location: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = role === "vendor" ? "/register/vendor" : "/register/user";

    try {
      const response = await axios.post(`http://localhost:5000/api/auth${endpoint}`, formData);
      alert(response.data.message);
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="container">
      <h2>Register as {role === "vendor" ? "Vendor" : "User"}</h2>

      {/* Role Selection */}
      <div>
        <label>
          <input type="radio" name="role" value="user" checked={role === "user"} onChange={() => setRole("user")} />
          User
        </label>
        <label>
          <input type="radio" name="role" value="vendor" checked={role === "vendor"} onChange={() => setRole("vendor")} />
          Vendor
        </label>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit}>
        {role === "vendor" ? (
          <>
            <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
            <input type="text" name="phone" placeholder="Phone Number" onChange={handleChange} required />
            <input type="text" name="aadhaarID" placeholder="Aadhaar ID" onChange={handleChange} required />
            <input type="text" name="category" placeholder="Business Category" onChange={handleChange} required />
            <input type="text" name="location" placeholder="Shop Location" onChange={handleChange} required />
          </>
        ) : (
          <>
            <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
            <input type="text" name="phone" placeholder="Phone Number" onChange={handleChange} required />
          </>
        )}
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
