import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CompleteProfile = () => {
  const [profileData, setProfileData] = useState({
    businessName: "",
    businessDescription: "",
    alternateContact: "",
    gstNumber: "",
    panNumber: "",
    yearsInBusiness: "",
    shopPhoto: null,
    vendorPhoto: null,
    preferredMarketArea: "",
    gpsCoordinates: "",
    spotType: "Temporary",
    alternateSpot: "",
    productsSold: "",
    dailyStock: "",
    peakSellingHours: "",
    priceRange: "",
    hasTradeLicense: false,
    requiresStorage: false,
    emergencyContact: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/vendors/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        console.log("Fetched profile data:", data); // Debug
        setProfileData(prev => ({ ...prev, ...data }));
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setProfileData({
      ...profileData,
      [name]: type === "checkbox" ? checked : files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      Object.keys(profileData).forEach((key) => {
        formData.append(key, profileData[key]);
      });

      const response = await axios.put(
        "http://localhost:5000/api/vendors/complete-profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Profile update response:", response.data); // Debug
      alert("Profile updated successfully!");
      navigate("/vendor");
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Profile update failed!");
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto bg-white shadow-lg p-6 rounded-lg mt-6">
      <button
        className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-xl"
        onClick={() => navigate("/vendor")}
      >
        ✖
      </button>

      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Complete Your Vendor Profile
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="businessName"
            value={profileData.businessName}
            placeholder="Business Name *"
            className="input-style"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="businessDescription"
            value={profileData.businessDescription}
            placeholder="Business Description"
            className="input-style"
            onChange={handleChange}
          />
          <input
            type="text"
            name="alternateContact"
            value={profileData.alternateContact}
            placeholder="Alternate Contact"
            className="input-style"
            onChange={handleChange}
          />
          <input
            type="text"
            name="gstNumber"
            value={profileData.gstNumber}
            placeholder="GST Number"
            className="input-style"
            onChange={handleChange}
          />
          <input
            type="text"
            name="panNumber"
            value={profileData.panNumber}
            placeholder="PAN Card Number"
            className="input-style"
            onChange={handleChange}
          />
          <input
            type="number"
            name="yearsInBusiness"
            value={profileData.yearsInBusiness}
            placeholder="Years in Business"
            className="input-style"
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-gray-700">
            Shop Photo:
            <input
              type="file"
              name="shopPhoto"
              className="block w-full text-gray-500 mt-2"
              onChange={handleChange}
            />
          </label>
          <label className="block text-gray-700">
            Vendor Photo:
            <input
              type="file"
              name="vendorPhoto"
              className="block w-full text-gray-500 mt-2"
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="preferredMarketArea"
            value={profileData.preferredMarketArea}
            placeholder="Preferred Market Area"
            className="input-style"
            onChange={handleChange}
          />
          <input
            type="text"
            name="gpsCoordinates"
            value={profileData.gpsCoordinates}
            placeholder="GPS Coordinates"
            className="input-style"
            onChange={handleChange}
          />
          <select
            name="spotType"
            value={profileData.spotType}
            className="input-style"
            onChange={handleChange}
          >
            <option value="Temporary">Temporary Spot</option>
            <option value="Permanent">Permanent Spot</option>
          </select>
          <input
            type="text"
            name="alternateSpot"
            value={profileData.alternateSpot}
            placeholder="Alternate Spot"
            className="input-style"
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="productsSold"
            value={profileData.productsSold}
            placeholder="Products Sold (comma separated)"
            className="input-style"
            onChange={handleChange}
          />
          <input
            type="number"
            name="dailyStock"
            value={profileData.dailyStock}
            placeholder="Average Daily Stock"
            className="input-style"
            onChange={handleChange}
          />
          <input
            type="text"
            name="peakSellingHours"
            value={profileData.peakSellingHours}
            placeholder="Peak Selling Hours"
            className="input-style"
            onChange={handleChange}
          />
          <input
            type="text"
            name="priceRange"
            value={profileData.priceRange}
            placeholder="Price Range"
            className="input-style"
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="hasTradeLicense"
              checked={profileData.hasTradeLicense}
              onChange={handleChange}
              className="form-checkbox text-blue-500"
            />
            <span>Do you have a trade license?</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresStorage"
              checked={profileData.requiresStorage}
              onChange={handleChange}
              className="form-checkbox text-blue-500"
            />
            <span>Do you require storage space?</span>
          </label>
        </div>

        <input
          type="text"
          name="emergencyContact"
          value={profileData.emergencyContact}
          placeholder="Emergency Contact Person & Number"
          className="input-style"
          onChange={handleChange}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold text-lg"
        >
          Complete Profile
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;