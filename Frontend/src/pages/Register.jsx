import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
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
    try {
        const response = await axios.post("http://localhost:5000/api/vendors/register", formData);
        console.log("Response from server:", response.data); // Debugging
        alert(`Registration successful! Your Shop ID: ${response.data.shopID}`);
        navigate("/login");
    } catch (error) {
        console.error("Error registering vendor:", error.response?.data || error); // Debugging
        alert(error.response?.data?.message || "Registration failed.");
    }
};


  return (
    <div className="container">
      <h2>Vendor Registration</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <input type="text" name="phone" placeholder="Phone Number" onChange={handleChange} required />
        <input type="text" name="aadhaarID" placeholder="Aadhaar ID" onChange={handleChange} required />
        <input type="text" name="category" placeholder="Business Category" onChange={handleChange} required />
        <input type="text" name="location" placeholder="Shop Location" onChange={handleChange} required />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
