// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Rectangle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom icons
const vendorIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const stallIcon = (taken) =>
  L.divIcon({
    html: `<div style="background-color: ${
      taken ? "green" : "red"
    }; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });

function AdminDashboard() {
  const [vendors, setVendors] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [message, setMessage] = useState("");
  const [placementMode, setPlacementMode] = useState("free");
  const [gridSize, setGridSize] = useState(5);
  const [bulkPlacement, setBulkPlacement] = useState(false);
  const [bulkStart, setBulkStart] = useState(null);
  const [bulkEnd, setBulkEnd] = useState(null);

  // Fetch vendors and stalls
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch vendors
        const vendorRes = await axios.get(
          "http://localhost:5000/api/admin/vendors",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVendors(vendorRes.data);

        // Fetch stalls
        const stallRes = await axios.get(
          "http://localhost:5000/api/admin/stalls",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStalls(stallRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    // Polling for live updates (every 10 seconds)
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Reset all stalls
  const resetStalls = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all stalls? This will clear all bookings."
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          "http://localhost:5000/api/admin/reset-stalls",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage(res.data.message);
        setTimeout(() => setMessage(""), 5000);
        // Refresh stalls
        const stallRes = await axios.get(
          "http://localhost:5000/api/admin/stalls",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStalls(stallRes.data);
      } catch (error) {
        setMessage(
          "Error: " + (error.response?.data?.message || error.message)
        );
        console.error("Error resetting stalls:", error);
      }
    }
  };

  // Clear all stalls
  const clearAllStalls = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all stalls? This will delete all stalls from the map."
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.delete(
          "http://localhost:5000/api/admin/clear-stalls",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessage(res.data.message);
        setTimeout(() => setMessage(""), 5000);
        setStalls([]); // Clear stalls from the UI
      } catch (error) {
        setMessage(
          "Error: " + (error.response?.data?.message || error.message)
        );
        console.error("Error clearing stalls:", error);
      }
    }
  };

  // Update vendor location
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
          vendor._id === vendorId
            ? { ...vendor, location: newLocation }
            : vendor
        )
      );

      alert("Vendor location updated successfully!");
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  // Create a new stall
  const createStall = async (lat, lng) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/admin/create-stall",
        { lat, lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStalls((prevStalls) => [...prevStalls, res.data]);
    } catch (error) {
      console.error("Error creating stall:", error);
      setMessage(
        "Error creating stall: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Create multiple stalls (bulk placement)
  const createStallsBulk = async (start, end) => {
    const metersToLatLng = (meters) => meters / 111000;
    const gridStep = metersToLatLng(gridSize);

    const minLat = Math.min(start.lat, end.lat);
    const maxLat = Math.max(start.lat, end.lat);
    const minLng = Math.min(start.lng, end.lng);
    const maxLng = Math.max(start.lng, end.lng);

    const newStalls = [];
    for (let lat = minLat; lat <= maxLat; lat += gridStep) {
      for (let lng = minLng; lng <= maxLng; lng += gridStep) {
        newStalls.push({ lat, lng });
      }
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/admin/create-stalls-bulk",
        { stalls: newStalls },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStalls((prevStalls) => [...prevStalls, ...res.data]);
    } catch (error) {
      console.error("Error creating stalls in bulk:", error);
      setMessage(
        "Error creating stalls in bulk: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Update stall position
  const updateStallPosition = async (stallId, newPosition) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:5000/api/admin/update-stall/${stallId}`,
        { lat: newPosition.lat, lng: newPosition.lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStalls((prevStalls) =>
        prevStalls.map((stall) =>
          stall._id === stallId
            ? { ...stall, lat: res.data.lat, lng: res.data.lng }
            : stall
        )
      );
    } catch (error) {
      console.error("Error updating stall position:", error);
      setMessage(
        "Error updating stall position: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Delete a stall
  const deleteStall = async (stallId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/admin/delete-stall/${stallId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStalls((prevStalls) =>
        prevStalls.filter((stall) => stall._id !== stallId)
      );
    } catch (error) {
      console.error("Error deleting stall:", error);
      setMessage(
        "Error deleting stall: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Component to toggle map dragging
  const MapDragToggle = () => {
    const map = useMap();
    useEffect(() => {
      if (bulkPlacement) {
        map.dragging.disable();
        map.scrollWheelZoom.disable();
      } else {
        map.dragging.enable();
        map.scrollWheelZoom.enable();
      }
    }, [map, bulkPlacement]);
    return null;
  };

  // Map event handler for placing stalls and selecting vendor locations
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        if (selectedVendor) {
          const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
          updateVendorLocation(selectedVendor._id, newLocation);
          setSelectedVendor(null);
        } else if (!bulkPlacement) {
          const lat =
            placementMode === "grid"
              ? Math.round(e.latlng.lat / (gridSize / 111000)) *
                (gridSize / 111000)
              : e.latlng.lat;
          const lng =
            placementMode === "grid"
              ? Math.round(e.latlng.lng / (gridSize / 111000)) *
                (gridSize / 111000)
              : e.latlng.lng;
          createStall(lat, lng);
        }
      },
      mousedown(e) {
        if (bulkPlacement) {
          setBulkStart({ lat: e.latlng.lat, lng: e.latlng.lng });
          setBulkEnd(null);
        }
      },
      mousemove(e) {
        if (bulkPlacement && bulkStart) {
          setBulkEnd({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      },
      mouseup(e) {
        if (bulkPlacement && bulkStart) {
          const end = { lat: e.latlng.lat, lng: e.latlng.lng };
          createStallsBulk(bulkStart, end);
          setBulkStart(null);
          setBulkEnd(null);
        }
      },
    });
    return null;
  };

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>

      {/* Reset Stalls Button */}
      <div className="mt-4">
        <button
          className="w-full max-w-xs py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          onClick={resetStalls}
        >
          Reset All Stalls
        </button>
        {message && (
          <p
            className={`mt-2 text-center ${
              message.includes("Error") ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* Stall Management Section */}
      <div className="mt-6">
        <h3 className="font-semibold text-gray-700">Manage Stalls</h3>
        <div className="flex space-x-4 mt-2">
          <div>
            <label className="mr-2">Placement Mode:</label>
            <select
              value={placementMode}
              onChange={(e) => setPlacementMode(e.target.value)}
              className="p-1 border rounded"
            >
              <option value="free">Free Placement</option>
              <option value="grid">Grid Placement</option>
            </select>
          </div>
          {placementMode === "grid" && (
            <div>
              <label className="mr-2">Grid Size (meters):</label>
              <input
                type="number"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="p-1 border rounded w-20"
                min="1"
              />
            </div>
          )}
          <div>
            <label className="mr-2">Bulk Placement:</label>
            <input
              type="checkbox"
              checked={bulkPlacement}
              onChange={(e) => setBulkPlacement(e.target.checked)}
            />
          </div>
        </div>
        <div className="mt-2">
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            onClick={clearAllStalls}
          >
            Clear All Stalls
          </button>
        </div>
        <p className="mt-2 text-gray-600">
          {bulkPlacement
            ? "Drag on the map to place multiple stalls in a grid (map dragging is disabled)."
            : "Click on the map to place a stall. Drag existing stalls to adjust their position."}
        </p>
      </div>

      {/* Map Section */}
      <div className="mt-6 h-96">
        <h3 className="font-semibold text-gray-700">
          Stall and Vendor Locations
        </h3>
        <MapContainer
          center={[19.066435205235848, 72.99389000336194]}
          zoom={18}
          style={{ height: "100%", width: "100%" }}
          dragging={!bulkPlacement}
          scrollWheelZoom={!bulkPlacement}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapDragToggle />
          <MapEvents />

          {/* Render Stalls */}
          {stalls.map((stall) => (
            <Marker
              key={stall._id}
              position={[stall.lat, stall.lng]}
              icon={stallIcon(stall.taken)}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const newPosition = e.target.getLatLng();
                  updateStallPosition(stall._id, newPosition);
                },
              }}
            >
              <Popup>
                <strong>{stall.name}</strong> <br />
                Status: {stall.taken ? "Booked" : "Available"} <br />
                {stall.taken && stall.vendorID && (
                  <>
                    Vendor ID: {stall.vendorID} <br />
                  </>
                )}
                Coordinates: {stall.lat}, {stall.lng} <br />
                <button
                  className="mt-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => deleteStall(stall._id)}
                >
                  Delete Stall
                </button>
              </Popup>
            </Marker>
          ))}

          {/* Render Vendors */}
          {vendors
            .filter((vendor) => vendor.location?.lat && vendor.location?.lng)
            .map((vendor) => (
              <Marker
                key={vendor._id}
                position={[vendor.location.lat, vendor.location.lng]}
                icon={vendorIcon}
              >
                <Popup>
                  <strong>{vendor.name}</strong> <br />
                  Shop ID: {vendor.shopID} <br />
                  Category: {vendor.category} <br />
                  Location: {vendor.location.lat}, {vendor.location.lng}
                </Popup>
              </Marker>
            ))}

          {/* Bulk Placement Rectangle */}
          {bulkStart && bulkEnd && (
            <Rectangle
              bounds={[
                [bulkStart.lat, bulkStart.lng],
                [bulkEnd.lat, bulkEnd.lng],
              ]}
              color="blue"
              fillOpacity={0.2}
            />
          )}
        </MapContainer>
      </div>

      {/* Vendor List */}
      <div className="mt-4">
        <h3 className="font-semibold text-gray-700">All Vendors:</h3>
        <ul className="mt-2">
          {vendors.map((vendor) => (
            <li
              key={vendor._id}
              className="p-2 border-b flex justify-between items-center"
            >
              <span>
                {vendor.name} - {vendor.shopID}
              </span>
              <button
                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setSelectedVendor(vendor)}
              >
                Assign Location
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AdminDashboard;
