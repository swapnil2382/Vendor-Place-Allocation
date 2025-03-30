import { useState, useEffect } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

// Custom marker icon
const vendorIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function AdminDashboard() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);

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

  // Function to update vendor location
  const updateVendorLocation = async (vendorId, newLocation) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/admin/reallocate/${vendorId}`,
        { location: newLocation },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVendors((prevVendors) =>
        prevVendors.map((vendor) =>
          vendor._id === vendorId ? { ...vendor, location: newLocation } : vendor
        )
      );

      alert("Vendor location updated successfully!");
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  // Component to handle selecting a location
  const LocationSelector = () => {
    useMapEvents({
      click(e) {
        if (selectedVendor) {
          const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
          updateVendorLocation(selectedVendor._id, newLocation);
          setSelectedVendor(null);
        }
      },
    });
    return null;
  };

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>

      {/* Vendor List */}
      <div className="mt-4">
        <h3 className="font-semibold">All Vendors:</h3>
        <ul>
          {vendors.map((vendor) => (
            <li key={vendor._id} className="p-2 border-b">
              {vendor.name} - {vendor.shopID}{" "}
              <button
                className="ml-2 p-1 bg-blue-500 text-white rounded"
                onClick={() => setSelectedVendor(vendor)}
              >
                Assign Location
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Map Section */}
      <div className="mt-6 h-96">
        <h3 className="font-semibold">Vendor Locations:</h3>
        <MapContainer center={[20, 78]} zoom={5} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationSelector />

          {vendors
            .filter((vendor) => vendor.location?.lat && vendor.location?.lng)
            .map((vendor) => (
              <Marker key={vendor._id} position={[vendor.location.lat, vendor.location.lng]} icon={vendorIcon}>
                <Popup>
                  <strong>{vendor.name}</strong> <br />
                  Shop ID: {vendor.shopID} <br />
                  Category: {vendor.category} <br />
                  Location: {vendor.location.lat}, {vendor.location.lng}
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default AdminDashboard;
