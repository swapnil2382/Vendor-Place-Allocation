import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import VendorProfile from "../components/VendorProfile";

function VendorDashboard() {
    const [vendor, setVendor] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchVendor = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("No authentication token found. Please log in.");
                return;
            }

            try {
                const res = await axios.get("http://localhost:5000/api/vendors/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setVendor(res.data);
            } catch (err) {
                setError("Failed to load vendor details.");
                console.error("Error fetching vendor:", err);
            }
        };

        fetchVendor();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6">
            <h2 className="text-2xl font-bold text-center mb-6">Vendor Dashboard</h2>

            {error && <p className="text-red-500">{error}</p>}

            {vendor ? (
                <div className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-800">Vendor Details</h3>
                        <p><strong>Name:</strong> {vendor.name}</p>
                        <p><strong>Shop ID:</strong> {vendor.shopID}</p>
                    </div>

                    {/* ✅ Links to Location & License Pages */}
                    <Link to="/vendor/location" className="block text-center bg-blue-500 text-white p-2 rounded">
                        Manage Location
                    </Link>

                    <Link to="/vendor/license" className="block text-center bg-green-500 text-white p-2 rounded">
                        Apply for License
                    </Link>

                    {/* ✅ Vendor Profile */}
                    {vendor.isProfileComplete ? (
                        <VendorProfile vendor={vendor} />
                    ) : (
                        <button
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
                            onClick={() => navigate("/complete-profile")}
                        >
                            Complete Profile
                        </button>
                    )}
                </div>
            ) : (
                <p className="text-center text-gray-600">Loading vendor details...</p>
            )}
        </div>
    );
}

export default VendorDashboard;
