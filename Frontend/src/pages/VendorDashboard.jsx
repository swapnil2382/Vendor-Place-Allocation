import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import VendorProfile from "../components/VendorProfile";

function VendorDashboard() {
    const [vendor, setVendor] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const fetchVendor = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("No authentication token found. Please log in.");
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.get("http://localhost:5000/api/vendors/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVendor(res.data);
            setError(null);
        } catch (err) {
            setError("Failed to load vendor details. Please try again.");
            console.error("Error fetching vendor:", err);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchVendor();
    }, [fetchVendor, location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleRetry = () => {
        fetchVendor();
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6">
            <h2 className="text-2xl font-bold text-center mb-6">Vendor Dashboard</h2>

            {error && (
                <div className="text-red-500 text-center">
                    <p>{error}</p>
                    <button
                        className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                        onClick={handleRetry}
                    >
                        Retry
                    </button>
                </div>
            )}

            {loading && !vendor ? (
                <p className="text-center text-gray-600">Loading vendor details...</p>
            ) : vendor ? (
                <div className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-800">Vendor Details</h3>
                        <p><strong>Name:</strong> {vendor.name}</p>
                        <p><strong>Shop ID:</strong> {vendor.shopID}</p>
                        <p>
                            <strong>License Status:</strong>{" "}
                            <span
                                className={`${
                                    vendor.license.status === "not issued"
                                        ? "text-gray-500"
                                        : vendor.license.status === "requested"
                                        ? "text-yellow-500"
                                        : vendor.license.status === "completed"
                                        ? "text-green-500"
                                        : "text-blue-500" // For "issued" if applicable
                                } font-semibold`}
                            >
                                {vendor.license.status === "not issued"
                                    ? "Not Issued"
                                    : vendor.license.status === "requested"
                                    ? "Requested"
                                    : vendor.license.status === "completed"
                                    ? "Completed"
                                    : "Issued"}
                            </span>
                        </p>
                    </div>

                    <Link
                        to="/vendor/location"
                        className="block text-center bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    >
                        Manage Location
                    </Link>

                    <Link
                        to="/vendor/license"
                        className="block text-center bg-green-500 text-white p-2 rounded hover:bg-green-600"
                    >
                        {vendor.license.status === "completed" ? "View License" : "Apply for License"}
                    </Link>

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

                    <button
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md mt-4"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export default VendorDashboard;