import React, { useState } from "react";
import axios from "axios";


const VendorProfile = ({ vendor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    businessName: vendor.businessName || "",
    businessDescription: vendor.businessDescription || "",
    gstNumber: vendor.gstNumber || "",
    panNumber: vendor.panNumber || "",
    yearsInBusiness: vendor.yearsInBusiness || "",
    preferredMarketArea: vendor.preferredMarketArea || "",
    spotType: vendor.spotType || "",
    alternateSpot: vendor.alternateSpot || "",
    productsSold:
      vendor.products?.length > 0
        ? vendor.products.map((p) => p.name).join(", ")
        : "",
    dailyStock: vendor.dailyStock || "",
    peakSellingHours: vendor.peakSellingHours || "",
    priceRange: vendor.priceRange || "",
    hasTradeLicense: vendor.hasTradeLicense || false,
    requiresStorage: vendor.requiresStorage || false,
    emergencyContact: vendor.emergencyContact || "",
    shopPhoto: null,
    vendorPhoto: null,
  });

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
        if (profileData[key] !== null) {
          formData.append(key, profileData[key]);
        }
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
      alert("Profile updated successfully.");
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Vendor Profile Details
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={profileData.businessName}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Business Description
              </label>
              <input
                type="text"
                name="businessDescription"
                value={profileData.businessDescription}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                GST Number
              </label>
              <input
                type="text"
                name="gstNumber"
                value={profileData.gstNumber}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                PAN Number
              </label>
              <input
                type="text"
                name="panNumber"
                value={profileData.panNumber}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Years in Business
              </label>
              <input
                type="number"
                name="yearsInBusiness"
                value={profileData.yearsInBusiness}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Preferred Market Area
              </label>
              <input
                type="text"
                name="preferredMarketArea"
                value={profileData.preferredMarketArea}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Spot Type
              </label>
              <select
                name="spotType"
                value={profileData.spotType}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Spot Type</option>
                <option value="Temporary">Temporary</option>
                <option value="Permanent">Permanent</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Alternate Spot
              </label>
              <input
                type="text"
                name="alternateSpot"
                value={profileData.alternateSpot}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Products Sold (Comma-Separated)
              </label>
              <input
                type="text"
                name="productsSold"
                value={profileData.productsSold}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Daily Stock (Items)
              </label>
              <input
                type="number"
                name="dailyStock"
                value={profileData.dailyStock}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Peak Selling Hours
              </label>
              <input
                type="text"
                name="peakSellingHours"
                value={profileData.peakSellingHours}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Price Range
              </label>
              <input
                type="text"
                name="priceRange"
                value={profileData.priceRange}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex items-center space-x-2 text-gray-700">
              <input
                type="checkbox"
                name="hasTradeLicense"
                checked={profileData.hasTradeLicense}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-700 rounded"
              />
              <span className="font-medium">Possesses Trade License</span>
            </label>
            <label className="flex items-center space-x-2 text-gray-700">
              <input
                type="checkbox"
                name="requiresStorage"
                checked={profileData.requiresStorage}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-700 rounded"
              />
              <span className="font-medium">Requires Storage Facility</span>
            </label>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Emergency Contact Number
            </label>
            <input
              type="text"
              name="emergencyContact"
              value={profileData.emergencyContact}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Shop Photograph
              </label>
              <input
                type="file"
                name="shopPhoto"
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-600"
              />
              {vendor.shopPhoto && (
                <img
                  src={vendor.shopPhoto}
                  alt="Current Shop"
                  className="w-24 h-24 mt-2 rounded object-cover border border-gray-200"
                />
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Vendor Photograph
              </label>
              <input
                type="file"
                name="vendorPhoto"
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-600"
              />
              {vendor.vendorPhoto && (
                <img
                  src={vendor.vendorPhoto}
                  alt="Current Vendor"
                  className="w-24 h-24 mt-2 rounded object-cover border border-gray-200"
                />
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="w-full bg-blue-700 text-white py-2 rounded font-medium hover:bg-blue-800 transition-colors"
            >
              Save Profile Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="w-full bg-gray-600 text-white py-2 rounded font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div>
            <dt className="font-medium">Business Name:</dt>
            <dd>{vendor.businessName || "Not Provided"}</dd>
          </div>
          <div>
            <dt className="font-medium">Business Description:</dt>
            <dd>{vendor.businessDescription || "Not Provided"}</dd>
          </div>
          <div>
            <dt className="font-medium">GST Number:</dt>
            <dd>{vendor.gstNumber || "Not Provided"}</dd>
          </div>
          <div>
            <dt className="font-medium">PAN Number:</dt>
            <dd>{vendor.panNumber || "Not Provided"}</dd>
          </div>
          <div>
            <dt className="font-medium">Years in Business:</dt>
            <dd>{vendor.yearsInBusiness || 0} years</dd>
          </div>
          <div>
            <dt className="font-medium">Preferred Market Area:</dt>
            <dd>{vendor.preferredMarketArea || "Not Provided"}</dd>
          </div>
          <div>
            <dt className="font-medium">Spot Type:</dt>
            <dd>{vendor.spotType || "Not Provided"}</dd>
          </div>
          <div>
            <dt className="font-medium">Alternate Spot:</dt>
            <dd>{vendor.alternateSpot || "Not Provided"}</dd>
          </div>
          <div>
            <dt className="font-medium">Products Sold:</dt>
            <dd>
              {vendor.products?.length > 0
                ? vendor.products.map((p) => p.name).join(", ")
                : "Not Provided"}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Daily Stock:</dt>
            <dd>{vendor.dailyStock || 0} items</dd>
          </div>
          <div>
            <dt className="font-medium">Peak Selling Hours:</dt>
            <dd>{vendor.peakSellingHours || "Not Provided"}</dd>
          </div>
          <div>
            <dt className="font-medium">Price Range:</dt>
            <dd>{vendor.priceRange || "Not Provided"}</dd>
          </div>
          <div>
            <dt className="font-medium">Trade License:</dt>
            <dd>{vendor.hasTradeLicense ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="font-medium">Storage Required:</dt>
            <dd>{vendor.requiresStorage ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="font-medium">Emergency Contact:</dt>
            <dd>{vendor.emergencyContact || "Not Provided"}</dd>
          </div>
          <div className="col-span-2 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="font-medium">Shop Photograph:</dt>
                <img
                  src={
                    vendor.shopPhoto ||
                    "https://dummyimage.com/160x160/ccc/fff&text=No+Image"
                  }
                  alt="Shop"
                  className="w-40 h-40 rounded object-cover border border-gray-200 mt-2"
                />
              </div>
              <div>
                <dt className="font-medium">Vendor Photograph:</dt>
                <img
                  src={
                    vendor.vendorPhoto ||
                    "https://dummyimage.com/160x160/ccc/fff&text=No+Image"
                  }
                  alt="Vendor"
                  className="w-40 h-40 rounded object-cover border border-gray-200 mt-2"
                />
              </div>
            </div>
          </div>
        </dl>
      )}
    </section>
  );
};

export default VendorProfile;