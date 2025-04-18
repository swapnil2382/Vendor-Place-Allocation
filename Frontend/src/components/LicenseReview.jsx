import React from "react";
import axios from "axios";

function LicenseReview({ vendor, closeModal, onApprove }) {
  // Ensure proper URL construction with error handling
  const getImageUrl = (path) => {
    if (!path) return null;

    // If already a full URL, return it
    if (path.startsWith("http")) return path;

    // If it's a relative path from uploads folder
    if (path.includes("/uploads/")) return `http://localhost:5000${path}`;

    // Default case - assume it's just a filename
    return `http://localhost:5000/uploads/${path}`;
  };

  const shopPhotoUrl = getImageUrl(vendor.license?.documents?.shopPhoto);
  const vendorPhotoUrl = getImageUrl(vendor.license?.documents?.vendorPhoto);

  const approveLicense = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/vendors/admin/approve-license/${vendor._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onApprove(vendor._id);
      alert("✅ License approved successfully!");
      closeModal();
    } catch (error) {
      console.error("Error approving license:", error);
      alert("❌ Failed to approve license.");
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
        <h3 className="font-bold text-lg">Review License Application</h3>
        <div className="mt-4">
          <p>
            <strong>Name:</strong> {vendor.name}
          </p>
          <p>
            <strong>Shop ID:</strong> {vendor.shopID}
          </p>
          <p>
            <strong>Category:</strong> {vendor.category}
          </p>
          <p>
            <strong>Aadhaar ID:</strong>{" "}
            {vendor.license?.documents?.aadhaarID || "N/A"}
          </p>
          <p>
            <strong>PAN Number:</strong>{" "}
            {vendor.license?.documents?.panNumber || "N/A"}
          </p>
          <p>
            <strong>Business Name:</strong>{" "}
            {vendor.license?.documents?.businessName || "N/A"}
          </p>
          <p>
            <strong>GST Number:</strong>{" "}
            {vendor.license?.documents?.gstNumber || "N/A"}
          </p>
          <p>
            <strong>Years in Business:</strong>{" "}
            {vendor.license?.documents?.yearsInBusiness ?? "0"}
          </p>
          <p>
            <strong>Description:</strong>{" "}
            {vendor.license?.documents?.businessDescription ?? "N/A"}
          </p>

          {/* Shop Photo */}
          {shopPhotoUrl && (
            <div className="mt-2">
              <p>
                <strong>Shop Photo:</strong>
              </p>
              <img
                src={shopPhotoUrl}
                alt="Shop"
                className="w-48 h-32 object-cover my-2 border border-gray-300 rounded"
                onError={(e) => {
                  console.error("Shop image failed to load:", e);
                  e.target.src = "http://localhost:5000/images/placeholder.png";
                  e.target.alt = "Image not available";
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* Vendor Photo */}
          {vendorPhotoUrl && (
            <div className="mt-2">
              <p>
                <strong>Vendor Photo:</strong>
              </p>
              <img
                src={vendorPhotoUrl}
                alt="Vendor"
                className="w-48 h-32 object-cover my-2 border border-gray-300 rounded"
                onError={(e) => {
                  console.error("Vendor image failed to load:", e);
                  e.target.src = "http://localhost:5000/images/placeholder.png";
                  e.target.alt = "Image not available";
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}

          <p>
            <strong>Applied On:</strong>{" "}
            {new Date(vendor.license?.appliedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className="bg-green-500 text-white px-3 py-1 rounded"
            onClick={approveLicense}
          >
            ✅ Approve
          </button>
          <button
            className="ml-3 bg-gray-500 text-white px-3 py-1 rounded"
            onClick={closeModal}
          >
            ❌ Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default LicenseReview;
