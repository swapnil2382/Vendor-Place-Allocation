import { useState, useEffect } from "react";
import axios from "axios";
import LicenseApproval from "../components/LicenseApproval";

function AdminDashboard() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Fetch vendors
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

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>

      {/* Vendor List with License Status */}
      <div className="mt-4">
        <h3 className="font-semibold">All Vendors:</h3>
        <ul>
          {vendors.map((vendor) => (
            <li key={vendor._id} className="p-2 border-b flex justify-between">
              <span>
                {vendor.name} - {vendor.shopID}
              </span>

              {/* License Status */}
              <span>
                {vendor.licenseStatus === "completed" ? (
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded"
                    onClick={() => setSelectedVendor(vendor)}
                  >
                    Completed
                  </button>
                ) : vendor.licenseStatus === "issued" ? (
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() => {
                      setSelectedVendor(vendor);
                      setShowApprovalModal(true);
                    }}
                  >
                    Issued
                  </button>
                ) : (
                  <span className="bg-gray-400 text-white px-2 py-1 rounded">Not Issued</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Show License Approval Modal */}
      {showApprovalModal && selectedVendor && (
        <LicenseApproval
          vendor={selectedVendor}
          closeModal={() => {
            setShowApprovalModal(false);
            setSelectedVendor(null);
          }}
          setVendors={setVendors}
        />
      )}

      {/* Show License Details if Completed */}
      {selectedVendor && selectedVendor.licenseStatus === "completed" && (
        <div className="mt-6 p-4 border rounded shadow-lg">
          <h3 className="font-bold text-lg">Vendor License Details</h3>
          <img src={selectedVendor.licenseImage} alt="License" className="w-72 my-3" />
          <p><strong>Name:</strong> {selectedVendor.name}</p>
          <p><strong>Shop ID:</strong> {selectedVendor.shopID}</p>
          <p><strong>Category:</strong> {selectedVendor.category}</p>
          <p><strong>Issued On:</strong> {selectedVendor.licenseDate}</p>
          <div className="bg-green-500 text-white px-3 py-1 mt-3 inline-block rounded">
            ✅ Approved
          </div>
          <button
            className="mt-3 bg-red-500 text-white px-3 py-1 rounded"
            onClick={() => setSelectedVendor(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
