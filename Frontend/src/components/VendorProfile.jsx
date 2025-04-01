import React from "react";

const VendorProfile = ({ vendor }) => {
    return (
        <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">Profile Details</h3>
            <p><strong>Business Name:</strong> {vendor.businessName}</p>
            <p><strong>Business Description:</strong> {vendor.businessDescription}</p>
            <p><strong>GST Number:</strong> {vendor.gstNumber || "N/A"}</p>
            <p><strong>PAN Number:</strong> {vendor.panNumber || "N/A"}</p>
            <p><strong>Years in Business:</strong> {vendor.yearsInBusiness} years</p>
            <p><strong>Preferred Market Area:</strong> {vendor.preferredMarketArea}</p>
            <p><strong>Spot Type:</strong> {vendor.spotType}</p>
            <p><strong>Alternate Spot:</strong> {vendor.alternateSpot || "N/A"}</p>
            <p><strong>Products Sold:</strong> {vendor.productsSold}</p>
            <p><strong>Daily Stock:</strong> {vendor.dailyStock} items</p>
            <p><strong>Peak Selling Hours:</strong> {vendor.peakSellingHours}</p>
            <p><strong>Price Range:</strong> {vendor.priceRange}</p>
            <p><strong>Trade License:</strong> {vendor.hasTradeLicense ? "Yes" : "No"}</p>
            <p><strong>Storage Required:</strong> {vendor.requiresStorage ? "Yes" : "No"}</p>
            <p><strong>Emergency Contact:</strong> {vendor.emergencyContact}</p>

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
                {!vendor.vendorPhoto && (
                    <div>
                        <p className="font-semibold">Vendor Photo:</p>
                        <img 
                            src="https://dummyimage.com/40x40/000/fff&text=No+Photo" 
                            alt="Placeholder" 
                            className="w-40 h-40 rounded-lg object-cover" 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorProfile;
