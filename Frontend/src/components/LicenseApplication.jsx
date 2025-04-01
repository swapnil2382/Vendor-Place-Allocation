import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const LicenseApplication = ({ vendor = {} }) => {
    const [formData, setFormData] = useState({
        aadhaarID: "",
        gstNumber: "",
        panNumber: "",
        yearsInBusiness: "",
        businessName: "",
        businessDescription: "",
        shopPhoto: null,
        vendorPhoto: null,
    });

    const [licenseStatus, setLicenseStatus] = useState("not issued");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [vendorData, setVendorData] = useState(null);
    const certificateRef = useRef(null);

    const fetchVendorData = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/vendors/me", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            const data = res.data;
            setVendorData(data);

            if (data.license) {
                setLicenseStatus(data.license.status);
                setFormData({
                    aadhaarID: data.license?.documents?.aadhaarID || "",
                    gstNumber: data.license?.documents?.gstNumber || "",
                    panNumber: data.license?.documents?.panNumber || "",
                    yearsInBusiness: data.license?.documents?.yearsInBusiness || "",
                    businessName: data.license?.documents?.businessName || "",
                    businessDescription: data.license?.documents?.businessDescription || "",
                    shopPhoto: null,
                    vendorPhoto: null,
                });
            } else {
                setLicenseStatus("not issued");
            }
        } catch (error) {
            console.error("Error fetching vendor details:", error);
            setError("❌ Failed to fetch vendor details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendorData();
    }, []);

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
                if (formData[key]) formDataToSend.append(key, formData[key]);
            });

            await axios.post("http://localhost:5000/api/vendors/apply-license", formDataToSend, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setMessage("✅ License application submitted successfully!");
            setLicenseStatus("requested");
            fetchVendorData();
        } catch (err) {
            console.error("❌ Error applying for license:", err);
            setError("❌ Failed to apply. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const downloadCertificate = () => {
        const input = certificateRef.current;
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const width = pdf.internal.pageSize.getWidth() - 20; // 10mm margin on each side
            const height = (canvas.height * width) / canvas.width;
            pdf.addImage(imgData, "PNG", 10, 10, width, height);
            pdf.save(`Vendor_License_${vendorData?.license?.licenseNumber}.pdf`);
        });
    };

    const printCertificate = () => {
        const input = certificateRef.current;
        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const printWindow = window.open("", "_blank");
            printWindow.document.write(`
                <html>
                    <body>
                        <img src="${imgData}" style="width: 100%;" />
                        <script>window.print(); window.close();</script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        });
    };

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    return (
        <div className="bg-green-100 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-green-800">Business License Application</h3>

            {licenseStatus === "not issued" ? (
                <>
                    {error && <p className="text-red-500 font-semibold mt-2">{error}</p>}
                    {message && <p className="text-green-600 font-semibold mt-2">{message}</p>}

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <input
                            type="text"
                            name="aadhaarID"
                            value={formData.aadhaarID}
                            onChange={handleChange}
                            placeholder="Aadhaar ID *"
                            className="border p-2 rounded"
                        />
                        <input
                            type="text"
                            name="panNumber"
                            value={formData.panNumber}
                            onChange={handleChange}
                            placeholder="PAN Number *"
                            className="border p-2 rounded"
                        />
                        <input
                            type="text"
                            name="gstNumber"
                            value={formData.gstNumber}
                            onChange={handleChange}
                            placeholder="GST Number (if applicable)"
                            className="border p-2 rounded"
                        />
                        <input
                            type="number"
                            name="yearsInBusiness"
                            value={formData.yearsInBusiness}
                            onChange={handleChange}
                            placeholder="Years in Business"
                            className="border p-2 rounded"
                        />
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            placeholder="Business Name *"
                            className="border p-2 rounded"
                        />
                        <textarea
                            name="businessDescription"
                            value={formData.businessDescription}
                            onChange={handleChange}
                            placeholder="Business Description"
                            className="border p-2 rounded"
                        ></textarea>
                        <div>
                            <label className="block text-sm font-medium">Shop Photo *</label>
                            <input
                                type="file"
                                name="shopPhoto"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="border p-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Vendor Photo *</label>
                            <input
                                type="file"
                                name="vendorPhoto"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="border p-2 rounded"
                            />
                        </div>
                    </div>

                    <button
                        onClick={applyForLicense}
                        className={`mt-4 px-4 py-2 rounded-md text-white ${
                            loading ? "bg-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                        }`}
                        disabled={loading}
                    >
                        {loading ? "Applying..." : "Apply for License"}
                    </button>
                </>
            ) : licenseStatus === "requested" ? (
                <p className="text-yellow-500 font-semibold mt-2">⏳ Not Confirmed Yet - Waiting for Admin Approval...</p>
            ) : (
                vendorData?.license ? (
                    <div className="mt-2">
                        <p className="text-green-600 font-semibold mb-4">✅ License Approved!</p>
                        {/* Certificate Design (Matching CompletedLicense) */}
                        <div
                            ref={certificateRef}
                            className="border-8 border-yellow-600 p-6 bg-white shadow-md text-left flex flex-col"
                            style={{ fontFamily: "'Times New Roman', serif" }}
                        >
                            {/* Header Section */}
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-800">Government of India</h2>
                                    <p className="text-lg text-gray-600 italic">Ministry of Commerce and Industry</p>
                                    <p className="text-sm text-gray-500">Business Regulatory Authority</p>
                                </div>
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/8/84/Government_of_India_logo.svg"
                                    alt="Indian Govt Emblem"
                                    className="w-16 h-16"
                                />
                            </div>

                            <hr className="border-t-2 border-gray-300 my-4 w-full" />

                            {/* Certificate Title */}
                            <h3 className="text-2xl font-semibold text-center text-gray-800 mb-6">
                                Certificate of Vendor License
                            </h3>

                            {/* Vendor Photo */}
                            <div className="flex justify-center mb-6">
                                <img
                                    src={vendorData.license.documents.vendorPhoto || "https://via.placeholder.com/150"}
                                    alt="Vendor"
                                    className="w-32 h-32 border-4 border-gray-600 shadow-lg rounded-full object-cover"
                                    onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=No+Image")}
                                />
                            </div>

                            {/* Vendor Information */}
                            <div className="grid grid-cols-2 gap-4 text-lg mb-6">
                                <p><strong>License No:</strong> {vendorData.license.licenseNumber}</p>
                                <p><strong>Vendor Name:</strong> {vendorData.name}</p>
                                <p><strong>Shop ID:</strong> {vendorData.shopID}</p>
                                <p><strong>Business Name:</strong> {vendorData.license.documents.businessName}</p>
                                <p><strong>Business Category:</strong> {vendorData.category || "N/A"}</p>
                                <p><strong>GST Number:</strong> {vendorData.license.documents.gstNumber || "Not Provided"}</p>
                                <p><strong>Aadhaar ID:</strong> {vendorData.license.documents.aadhaarID || "N/A"}</p>
                                <p><strong>PAN Number:</strong> {vendorData.license.documents.panNumber || "N/A"}</p>
                                <p><strong>Years in Business:</strong> {vendorData.license.documents.yearsInBusiness || "N/A"}</p>
                                <p><strong>Issued On:</strong> {new Date(vendorData.license.approvedAt).toLocaleDateString()}</p>
                                <p className="col-span-2">
                                    <strong>Business Description:</strong> {vendorData.license.documents.businessDescription || "Not Provided"}
                                </p>
                            </div>

                            {/* Approval Section */}
                            <div className="mt-auto">
                                <div className="flex justify-center mb-4">
                                    <img
                                        src="https://via.placeholder.com/100x100?text=Official+Seal"
                                        alt="Government Seal"
                                        className="w-24 h-24"
                                    />
                                </div>
                                <p className="text-green-600 font-bold text-xl text-center mb-2">
                                    ✅ Approved by Government Authority
                                </p>
                                <p className="text-sm text-gray-600 text-center italic">
                                    This certificate is issued to the above-named vendor under the authority of the Government of India.
                                </p>
                                <p className="text-sm text-gray-600 text-center mt-2">
                                    <strong>Authorized Signatory</strong>
                                </p>
                            </div>
                        </div>

                        {/* Buttons for Download and Print */}
                        <div className="mt-4 flex justify-center gap-4">
                            <button
                                onClick={downloadCertificate}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Download as PDF
                            </button>
                            <button
                                onClick={printCertificate}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                                Print Certificate
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-red-500 font-semibold mt-2">❌ License data unavailable.</p>
                )
            )}
        </div>
    );
};

export default LicenseApplication;