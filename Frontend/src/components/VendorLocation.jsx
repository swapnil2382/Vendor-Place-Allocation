import React, { useState } from "react";
import axios from "axios";

const VendorLocation = ({ vendorId }) => {
    const [location, setLocation] = useState({ latitude: "", longitude: "" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setLocation({ ...location, [e.target.name]: e.target.value });
    };

    const updateLocation = async () => {
        try {
            const res = await axios.put(
                "http://localhost:5000/api/vendors/update-location",
                { vendorId, location },  // ✅ Make sure `vendorId` is included
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            setMessage(res.data.message);
            setError("");
        } catch (err) {
            console.error("Error updating location:", err);
            setError("Failed to update location. Try again later.");
        }
    };

    return (
        <div>
            <h3>Update Location</h3>
            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-600">{message}</p>}
            
            <input type="text" name="latitude" value={location.latitude} onChange={handleChange} placeholder="Latitude" />
            <input type="text" name="longitude" value={location.longitude} onChange={handleChange} placeholder="Longitude" />
            
            <button onClick={updateLocation}>Update Location</button>
        </div>
    );
};

export default VendorLocation;
