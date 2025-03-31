import React, { useState, useEffect } from "react";
import axios from "axios";

const LicenseApplication = ({ vendor }) => {
    const [formData, setFormData] = useState({
        aadhaarID: vendor?.aadhaarID || "",
        gstNumber: vendor?.gstNumber || "",
        panNumber: vendor?.panNumber || "",
        yearsInBusiness: vendor?.yearsInBusiness || "",
        businessName: vendor?.businessName || "",
        businessDescription: vendor?.businessDescription || "",
        shopPhoto: null,
        vendorPhoto: null,
    });

    const [licenseStatus, setLicenseStatus] = useState(vendor?.licenseStatus || ""); 
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (vendor) {
            setLicenseStatus(vendor.licenseStatus || "");
            setFormData({
                aadhaarID: vendor?.aadhaarID || "",
                gstNumber: vendor?.gstNumber || "",
                panNumber: vendor?.panNumber || "",
                yearsInBusiness: vendor?.yearsInBusiness || "",
                businessName: vendor?.businessName || "",
                businessDescription: vendor?.businessDescription || "",
                shopPhoto: null,
                vendorPhoto: null,
            });
        }
    }, [vendor]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    };

    const applyForLicense = async () => {
        if (!formData.aadhaarID || !formData.panNumber || !formData.businessName || !formData.shopPhoto || !formData.vendorPhoto) {
            setError("❌ Please fill in all required fields.");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach((key) => {
                if (formData[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            const res = await axios.post("http://localhost:5000/api/vendors/apply-license", formDataToSend, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setMessage("✅ License application submitted successfully!");
            setLicenseStatus("waiting"); // Update status to waiting
            setError("");
        } catch (err) {
            console.error("❌ Error applying for license:", err);
            setError("❌ Failed to apply. Please try again.");
        }

        setLoading(false);
    };

    return (
        <div className="bg-green-100 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-green-800">Business License Application</h3>

            {licenseStatus === "waiting" ? (
                <p className="text-yellow-500 font-semibold mt-2">⏳ Waiting for Approval...</p>
            ) : licenseStatus === "completed" ? (
                <p className="text-green-600 font-semibold mt-2">✅ License Approved!</p>
            ) : (
                <>
                    {error && <p className="text-red-500 font-semibold mt-2">{error}</p>}
                    {message && <p className="text-green-600 font-semibold mt-2">{message}</p>}

                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" name="aadhaarID" value={formData.aadhaarID} onChange={handleChange} placeholder="Aadhaar ID *" className="border p-2 rounded" />
                        <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} placeholder="PAN Number *" className="border p-2 rounded" />
                        <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="GST Number (if applicable)" className="border p-2 rounded" />
                        <input type="number" name="yearsInBusiness" value={formData.yearsInBusiness} onChange={handleChange} placeholder="Years in Business" className="border p-2 rounded" />
                        <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Business Name *" className="border p-2 rounded" />
                        <textarea name="businessDescription" value={formData.businessDescription} onChange={handleChange} placeholder="Business Description" className="border p-2 rounded"></textarea>

                        <div>
                            <label className="block text-sm font-medium">Shop Photo *</label>
                            <input type="file" name="shopPhoto" onChange={handleFileChange} accept="image/*" className="border p-2 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Vendor Photo *</label>
                            <input type="file" name="vendorPhoto" onChange={handleFileChange} accept="image/*" className="border p-2 rounded" />
                        </div>
                    </div>

                    <button
                        onClick={applyForLicense}
                        className={`mt-4 px-4 py-2 rounded-md text-white ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
                        disabled={loading}
                    >
                        {loading ? "Applying..." : "Apply for License"}
                    </button>
                </>
            )}
        </div>
    );
};

export default LicenseApplication;
