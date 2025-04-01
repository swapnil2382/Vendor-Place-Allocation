import axios from "axios";

function LicenseApproval({ vendor, closeModal, setVendors }) {
  const approveLicense = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/admin/approve-license/${vendor._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVendors((prevVendors) =>
        prevVendors.map((v) =>
          v._id === vendor._id ? { ...v, licenseStatus: "completed" } : v
        )
      );

      alert("License approved successfully!");
      closeModal();
    } catch (error) {
      console.error("Error approving license:", error);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg">
        <h3 className="font-bold text-lg">Review License</h3>
        <img src={vendor.licenseImage} alt="License" className="w-72 my-3" />
        <p><strong>Name:</strong> {vendor.name}</p>
        <p><strong>Shop ID:</strong> {vendor.shopID}</p>
        <p><strong>Category:</strong> {vendor.category}</p>
        <p><strong>Submitted On:</strong> {vendor.licenseDate}</p>
        <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={approveLicense}>
          Approve
        </button>
        <button className="ml-3 bg-gray-500 text-white px-3 py-1 rounded" onClick={closeModal}>
          Close
        </button>
      </div>
    </div>
  );
}

export default LicenseApproval;
