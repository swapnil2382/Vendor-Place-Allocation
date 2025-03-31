import { useState, useEffect } from "react";
import axios from "axios";
import LicenseReview from "../components/LicenseReview";
import CompletedLicense from "../components/CompletedLicense";

function AdminDashboard() {
    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showCompletedModal, setShowCompletedModal] = useState(false);

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:5000/api/admin/vendors", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setVendors(res.data);
            } catch (error) {
                console.error("Error fetching vendors:", error);
            }
        };
        fetchVendors();
    }, []);

    const handleLicenseClick = (vendor) => {
        if (vendor.license.status === "not issued") return; // Prevent clicking on "Not Issued"

        setSelectedVendor(vendor);
        if (vendor.license.status === "requested") {
            setShowReviewModal(true);
        } else if (vendor.license.status === "completed") {
            setShowCompletedModal(true);
        }
    };

    const handleApprove = async (vendorId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `http://localhost:5000/api/admin/approve-license/${vendorId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setVendors((prevVendors) =>
                prevVendors.map((v) =>
                    v._id === vendorId ? { ...v, license: { ...v.license, status: "completed" } } : v
                )
            );

            setShowReviewModal(false);
            setSelectedVendor(null);
        } catch (error) {
            console.error("Error approving license:", error);
            alert("❌ Failed to approve license.");
        }
    };

    return (
        <div className="p-5">
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
            <div className="mt-4">
                <h3 className="font-semibold">Vendors:</h3>
                <ul>
                    {vendors.map((vendor) => (
                        <li key={vendor._id} className="p-2 border-b flex justify-between">
                            <span>{vendor.name} - {vendor.shopID}</span>
                            <span
                                className={`px-2 py-1 rounded cursor-pointer ${
                                    vendor.license.status === "not issued"
                                        ? "bg-gray-400 text-white cursor-not-allowed"
                                        : vendor.license.status === "requested"
                                        ? "bg-yellow-500 text-white"
                                        : vendor.license.status === "issued"
                                        ? "bg-blue-500 text-white"
                                        : "bg-green-500 text-white"
                                }`}
                                onClick={() => handleLicenseClick(vendor)}
                            >
                                {vendor.license.status === "not issued"
                                    ? "Not Issued"
                                    : vendor.license.status === "requested"
                                    ? "Requested"
                                    : vendor.license.status === "issued"
                                    ? "Issued"
                                    : "Completed"}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {showReviewModal && selectedVendor && (
                <LicenseReview
                    vendor={selectedVendor}
                    closeModal={() => {
                        setShowReviewModal(false);
                        setSelectedVendor(null);
                    }}
                    onApprove={handleApprove}
                />
            )}

            {showCompletedModal && selectedVendor && (
                <CompletedLicense
                    vendor={selectedVendor}
                    closeModal={() => {
                        setShowCompletedModal(false);
                        setSelectedVendor(null);
                    }}
                />
            )}
        </div>
    );
}

export default AdminDashboard;
