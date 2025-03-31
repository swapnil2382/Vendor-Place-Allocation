import React, { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

function CompletedLicense({ vendor, closeModal }) {
    const licenseRef = useRef(null);

    const handleDownload = async () => {
        const element = licenseRef.current;
        const canvas = await html2canvas(element, { scale: 3 });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("portrait", "mm", "a4");
        const width = pdf.internal.pageSize.getWidth() - 20; // Margin of 10mm on each side
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, "PNG", 10, 10, width, height);
        pdf.save(`Vendor_License_${vendor.name}_${vendor.license.licenseNumber}.pdf`);
    };

    return (
        <div className="fixed top-0 left-0 w-full h-screen flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-[70vw] h-[95vh] max-w-3xl relative flex flex-col">
                {/* License Container */}
                <div
                    ref={licenseRef}
                    className="border-8 border-yellow-600 p-6 bg-white flex-grow shadow-md text-left flex flex-col"
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
                            src={vendor.license.documents.vendorPhoto || "https://via.placeholder.com/150"}
                            alt="Vendor"
                            className="w-32 h-32 border-4 border-gray-600 shadow-lg rounded-full object-cover"
                            onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=No+Image")}
                        />
                    </div>

                    {/* Vendor Information */}
                    <div className="grid grid-cols-2 gap-4 text-lg mb-6">
                        <p><strong>License No:</strong> {vendor.license.licenseNumber}</p>
                        <p><strong>Vendor Name:</strong> {vendor.name}</p>
                        <p><strong>Shop ID:</strong> {vendor.shopID}</p>
                        <p><strong>Business Name:</strong> {vendor.license.documents.businessName}</p>
                        <p><strong>Business Category:</strong> {vendor.category || "N/A"}</p>
                        <p><strong>GST Number:</strong> {vendor.license.documents.gstNumber || "Not Provided"}</p>
                        <p><strong>Aadhaar ID:</strong> {vendor.license.documents.aadhaarID || "N/A"}</p>
                        <p><strong>PAN Number:</strong> {vendor.license.documents.panNumber || "N/A"}</p>
                        <p><strong>Years in Business:</strong> {vendor.license.documents.yearsInBusiness || "N/A"}</p>
                        <p><strong>Issued On:</strong> {new Date(vendor.license.approvedAt).toLocaleDateString()}</p>
                        <p className="col-span-2"><strong>Business Description:</strong> {vendor.license.documents.businessDescription || "Not Provided"}</p>
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

                {/* Buttons */}
                <div className="flex justify-between mt-4">
                    <button
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                        onClick={closeModal}
                    >
                        Close
                    </button>
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        onClick={handleDownload}
                    >
                        Download License
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CompletedLicense;