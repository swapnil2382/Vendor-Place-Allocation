import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function VendorDashboard() {
    const [vendor, setVendor] = useState(null);
    const [error, setError] = useState(null);
    const [attendanceMarked, setAttendanceMarked] = useState(false);
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
                setError("Failed to load vendor details. Please try again.");
                console.error("Error fetching vendor:", err);
            }
        };

        fetchVendor();
    }, []);

    const markAttendance = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:5000/api/vendors/mark-attendance", {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAttendanceMarked(true);
        } catch (error) {
            setError("Error marking attendance. Please try again.");
            console.error("Error marking attendance:", error);
        }
    };

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
                        <p><strong>Assigned Spot:</strong> {vendor.location}</p>
                    </div>

                    {vendor.isProfileComplete ? (
                        // Display Vendor Profile Details if completed
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <h3 className="text-xl font-semibold text-gray-800">Profile Details</h3>
                            <p><strong>Business Name:</strong> {vendor.businessName}</p>
                            <p><strong>Business Description:</strong> {vendor.businessDescription}</p>
                            <p><strong>GST Number:</strong> {vendor.gstNumber || "N/A"}</p>
                            <p><strong>PAN Number:</strong> {vendor.panNumber || "N/A"}</p>
                            <p><strong>Years in Business:</strong> {vendor.yearsInBusiness} years</p>
                            <p><strong>Preferred Market Area:</strong> {vendor.preferredMarketArea}</p>
                            <p><strong>GPS Coordinates:</strong> {vendor.gpsCoordinates}</p>
                            <p><strong>Spot Type:</strong> {vendor.spotType}</p>
                            <p><strong>Alternate Spot:</strong> {vendor.alternateSpot || "N/A"}</p>
                            <p><strong>Products Sold:</strong> {vendor.productsSold}</p>
                            <p><strong>Daily Stock:</strong> {vendor.dailyStock} items</p>
                            <p><strong>Peak Selling Hours:</strong> {vendor.peakSellingHours}</p>
                            <p><strong>Price Range:</strong> {vendor.priceRange}</p>
                            <p><strong>Trade License:</strong> {vendor.hasTradeLicense ? "Yes" : "No"}</p>
                            <p><strong>Storage Required:</strong> {vendor.requiresStorage ? "Yes" : "No"}</p>
                            <p><strong>Emergency Contact:</strong> {vendor.emergencyContact}</p>

                            {/* Display Uploaded Photos if available */}
                            <div className="flex gap-4 mt-4">
                                {vendor.shopPhoto && (
                                    <div>
                                        <p className="font-semibold">Shop Photo:</p>
                                        <img src={vendor.shopPhoto} alt="Shop" className="w-40 h-40 rounded-lg object-cover" />
                                    </div>
                                )}
                                {vendor.vendorPhoto && (
                                    <div>
                                        <p className="font-semibold">Vendor Photo:</p>
                                        <img src={vendor.vendorPhoto} alt="Vendor" className="w-40 h-40 rounded-lg object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Show "Complete Profile" button if profile is not completed
                        <button 
                            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                            onClick={() => navigate("/complete-profile")}
                        >
                            Complete Profile
                        </button>
                    )}

                    {/* Attendance Button */}
                    <button 
                        className={`w-full py-2 rounded-md text-white font-semibold ${
                            attendanceMarked ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                        }`} 
                        onClick={markAttendance} 
                        disabled={attendanceMarked}
                    >
                        {attendanceMarked ? "Attendance Marked" : "Mark Attendance"}
                    </button>
                </div>
            ) : (
                <p className="text-center text-gray-600">Loading vendor details...</p>
            )}
        </div>
    );
}

export default VendorDashboard;
