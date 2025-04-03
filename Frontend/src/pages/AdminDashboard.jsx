import { useState, useEffect } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import LicenseReview from "../components/LicenseReview";
import CompletedLicense from "../components/CompletedLicense";
import MapComponent from "./MapComponent";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Marker, Popup } from "leaflet";

const vendorIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [message, setMessage] = useState("");
  const [gridSize, setGridSize] = useState(5);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [numStalls, setNumStalls] = useState(1);
  const [mapVisible, setMapVisible] = useState(true);
  const [activeView, setActiveView] = useState("dashboard"); // Added for view switching

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage(t("auth_required"));
      setError("Authentication required");
      navigate("/login");
    }
  }, [navigate, t]);

  const api = axios.create({
    baseURL: "http://localhost:5000/api",
  });

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (
        error.response &&
        error.response.status === 401 &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        console.log("Current token:", localStorage.getItem("token"));
        localStorage.removeItem("token");
        setMessage(t("auth_required"));
        navigate("/login");
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!localStorage.getItem("token")) return;

      setIsLoading(true);
      try {
        const vendorRes = await api.get(`/admin/vendors?lang=${i18n.language}`);
        setVendors(vendorRes.data);

        const stallRes = await api.get(`/admin/stalls?lang=${i18n.language}`);
        setStalls(stallRes.data);

        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status !== 401) {
          setError(t("error_fetching_data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [i18n.language]);

  useEffect(() => {
    setMapVisible(!(showReviewModal || showCompletedModal));
  }, [showReviewModal, showCompletedModal]);

  const handleLicenseClick = (vendor) => {
    if (vendor.license.status === "not issued") return;
    setSelectedVendor(vendor);
    if (vendor.license.status === "requested") {
      setShowReviewModal(true);
    } else if (vendor.license.status === "completed") {
      setShowCompletedModal(true);
    }
  };

  const handleApprove = async (vendorId) => {
    try {
      await api.post(`/admin/approve-license/${vendorId}`);
      setVendors((prevVendors) =>
        prevVendors.map((v) =>
          v._id === vendorId
            ? { ...v, license: { ...v.license, status: "completed" } }
            : v
        )
      );
      setShowReviewModal(false);
      setSelectedVendor(null);
      setMessage(t("license_approved"));
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Error approving license:", error);
      if (error.response?.status !== 401) {
        setMessage(t("error_approving_license"));
      }
    }
  };

  const resetStalls = async () => {
    if (window.confirm(t("confirm_reset"))) {
      try {
        const res = await api.post("/admin/reset-stalls");
        setMessage(res.data.message);
        setTimeout(() => setMessage(""), 5000);
        const stallRes = await api.get("/admin/stalls");
        setStalls(stallRes.data);
      } catch (error) {
        if (error.response?.status !== 401) {
          setMessage(t("error_resetting_stalls"));
        }
        console.error("Error resetting stalls:", error);
      }
    }
  };

  const clearAllStalls = async () => {
    if (window.confirm(t("confirm_clear"))) {
      try {
        const res = await api.delete("/admin/clear-stalls");
        setMessage(res.data.message);
        setTimeout(() => setMessage(""), 5000);
        setStalls([]);
      } catch (error) {
        if (error.response?.status !== 401) {
          setMessage(t("error_clearing_stalls"));
        }
        console.error("Error clearing stalls:", error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const updateVendorLocation = async (vendorId, newLocation) => {
    try {
      await api.post(`/admin/reallocate/${vendorId}`, {
        location: newLocation,
      });
      setVendors((prevVendors) =>
        prevVendors.map((vendor) =>
          vendor._id === vendorId
            ? { ...vendor, location: newLocation }
            : vendor
        )
      );
      setMessage(t("vendor_location_updated"));
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      if (error.response?.status !== 401) {
        setMessage(t("error_updating_location"));
      }
      console.error("Error updating location:", error);
    }
  };

  const createStalls = async (lat, lng, locationName, numStalls) => {
    try {
      const metersToLatLng = (meters) => meters / 111000;
      const gridStep = metersToLatLng(gridSize);
      const newStalls = [];

      let currentLat = lat;
      let currentLng = lng;
      for (let i = 0; i < numStalls; i++) {
        newStalls.push({ lat: currentLat, lng: currentLng });
        currentLng += gridStep;
        if ((i + 1) % 3 === 0) {
          currentLat -= gridStep;
          currentLng = lng;
        }
      }

      const res = await api.post("/admin/create-stalls-bulk", {
        stalls: newStalls,
        locationName,
      });
      setStalls((prevStalls) => [...prevStalls, ...res.data]);
      setMessage(t("stalls_created", { count: res.data.length }));
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      if (error.response?.status !== 401) {
        setMessage(
          error.response?.data?.message || t("error_creating_bulk_stalls")
        );
      }
      console.error("Error creating stalls in bulk:", error);
    }
  };

  const updateStallPosition = async (stallId, newPosition) => {
    try {
      const res = await api.put(`/admin/update-stall/${stallId}`, {
        lat: newPosition.lat,
        lng: newPosition.lng,
      });
      setStalls((prevStalls) =>
        prevStalls.map((stall) =>
          stall._id === stallId
            ? { ...stall, lat: res.data.lat, lng: res.data.lng }
            : stall
        )
      );
    } catch (error) {
      if (error.response?.status !== 401) {
        setMessage(t("error_updating_stall_position"));
      }
      console.error("Error updating stall position:", error);
    }
  };

  const deleteStall = async (stallId) => {
    try {
      await api.delete(`/admin/delete-stall/${stallId}`);
      setStalls((prevStalls) =>
        prevStalls.filter((stall) => stall._id !== stallId)
      );
      setMessage(t("stall_deleted"));
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      if (error.response?.status !== 401) {
        setMessage(t("error_deleting_stall"));
      }
      console.error("Error deleting stall:", error);
    }
  };

  const handleMapClick = (latlng) => {
    if (selectedVendor) {
      const newLocation = { lat: latlng.lat, lng: latlng.lng };
      updateVendorLocation(selectedVendor._id, newLocation);
      setSelectedVendor(null);
    } else {
      setPendingLocation({ lat: latlng.lat, lng: latlng.lng });
    }
  };

  const handleLocationSubmit = () => {
    if (!locationName) {
      setMessage("Please enter a location name");
      return;
    }
    if (!numStalls || numStalls < 1) {
      setMessage("Please enter a valid number of stalls");
      return;
    }
    if (pendingLocation) {
      createStalls(
        pendingLocation.lat,
        pendingLocation.lng,
        locationName,
        numStalls
      );
      setPendingLocation(null);
      setLocationName("");
      setNumStalls(1);
    }
  };

  if (error && error === "Authentication required") {
    return (
      <div className="p-5 text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("admin_dashboard")}
        </h2>
        <div className="mt-8 p-4 bg-red-100 text-red-800 rounded-md">
          <p>{t("auth_required")}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={() => navigate("/login")}
          >
            {t("go_to_login")}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && vendors.length === 0 && stalls.length === 0) {
    return (
      <div className="p-5 text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("admin_dashboard")}
        </h2>
        <div className="mt-8">
          <p>{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-5">
        <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
        <ul>
          <li className="mb-4">
            <button
              className={`w-full text-left py-2 px-4 rounded ${
                activeView === "dashboard"
                  ? "bg-gray-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => setActiveView("vendors")}
            >
              Dashboard
            </button>
          </li>
        
          <li className="mb-4">
            <button
              className={`w-full text-left py-2 px-4 rounded ${
                activeView === "marketplace"
                  ? "bg-gray-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => setActiveView("marketplace")}
            >
              Marketplace
            </button>
          </li>
          <li className="mb-4">
            <button
              className="w-full text-left py-2 px-4 bg-gray-700 rounded hover:bg-gray-600"
              onClick={resetStalls}
            >
              Reset Stalls
            </button>
          </li>
          <li className="mb-4">
            <button
              className="w-full text-left py-2 px-4 bg-gray-700 rounded hover:bg-gray-600"
              onClick={clearAllStalls}
            >
              Clear Stalls
            </button>
          </li>
          <li className="mb-4">
            <button
              className="w-full text-left py-2 px-4 bg-gray-700 rounded hover:bg-gray-600"
              onClick={handleLogout}
            >
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          {activeView === "dashboard"
            ? t("admin_dashboard")
            : activeView === "vendors"
            ? "Vendors"
            : "Marketplace"}
        </h2>

        {message && (
          <div
            className={`mb-4 p-2 rounded text-center ${
              message.includes("Error")
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {message}
          </div>
        )}

        {activeView === "dashboard" && (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                {t("assign_locations")}
              </h3>
              {vendors.length === 0 ? (
                <p className="text-gray-500">{t("no_vendors")}</p>
              ) : (
                <div className="bg-white p-4 rounded-lg shadow">
                  <ul>
                    {vendors.map((vendor) => (
                      <li
                        key={vendor._id}
                        className="p-2 border-b flex justify-between items-center"
                      >
                        <span className="text-gray-700">
                          {vendor.name} - {vendor.shopID}
                        </span>
                        <button
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() => setSelectedVendor(vendor)}
                        >
                          {vendor.location?.lat
                            ? t("reassign_location")
                            : t("assign_location")}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === "vendors" && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              {t("vendor_licenses")}
            </h3>
            {vendors.length === 0 ? (
              <p className="text-gray-500">{t("no_vendors")}</p>
            ) : (
              <div className="bg-white p-4 rounded-lg shadow">
                <ul>
                  {vendors.map((vendor) => (
                    <li
                      key={vendor._id}
                      className="p-2 border-b flex justify-between items-center"
                    >
                      <span className="text-gray-700">
                        {vendor.name} - {vendor.shopID}
                      </span>
                      <span
                        className={`px-2 py-1 rounded cursor-pointer ${
                          vendor.license?.status === "not issued"
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : vendor.license?.status === "requested"
                            ? "bg-yellow-500 text-white"
                            : vendor.license?.status === "issued"
                            ? "bg-blue-500 text-white"
                            : "bg-green-500 text-white"
                        }`}
                        onClick={() => handleLicenseClick(vendor)}
                      >
                        {vendor.license?.status === "not issued"
                          ? t("not_issued")
                          : vendor.license?.status === "requested"
                          ? t("requested")
                          : vendor.license?.status === "issued"
                          ? t("issued")
                          : t("completed")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeView === "marketplace" && (
          <>
            {pendingLocation && (
              <div className="mb-6 p-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Add New Location</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., Downtown Market Square"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">
                    Number of Stalls
                  </label>
                  <input
                    type="number"
                    value={numStalls}
                    onChange={(e) => setNumStalls(Number(e.target.value))}
                    min="1"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">
                    Grid Size (meters)
                  </label>
                  <input
                    type="number"
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                    min="1"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleLocationSubmit}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setPendingLocation(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div
              className="mb-6"
              style={{ display: mapVisible ? "block" : "none" }}
            >
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                {t("manage_stalls")}
              </h3>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 mb-4">
                  Click on the map to mark a location and add stalls.
                </p>
                <div
                  className="h-[500px] rounded-lg overflow-hidden relative"
                  style={{ zIndex: 1 }}
                >
                  <MapComponent
                    center={[19.066435205235848, 72.99389000336194]}
                    zoom={18}
                    stalls={stalls}
                    onMapClick={handleMapClick}
                    onMarkerClick={(stall) => deleteStall(stall._id)}
                    showLocations={false}
                  />
                  {vendors
                    .filter(
                      (vendor) => vendor.location?.lat && vendor.location?.lng
                    )
                    .map((vendor) => (
                      <Marker
                        key={vendor._id}
                        position={[vendor.location.lat, vendor.location.lng]}
                        icon={vendorIcon}
                      >
                        <Popup>
                          <strong>{vendor.name}</strong> <br />
                          {t("shop_id")}: {vendor.shopID} <br />
                          {t("category")}: {vendor.category} <br />
                          {t("location")}: {vendor.location.lat},{" "}
                          {vendor.location.lng}
                        </Popup>
                      </Marker>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}

        {showReviewModal && selectedVendor && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => {
                setShowReviewModal(false);
                setSelectedVendor(null);
              }}
            ></div>
            <div className="bg-white p-6 rounded-lg shadow-xl relative max-w-2xl w-full mx-4 z-50">
              <LicenseReview
                vendor={selectedVendor}
                closeModal={() => {
                  setShowReviewModal(false);
                  setSelectedVendor(null);
                }}
                onApprove={handleApprove}
              />
            </div>
          </div>
        )}

        {showCompletedModal && selectedVendor && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => {
                setShowCompletedModal(false);
                setSelectedVendor(null);
              }}
            ></div>
            <div className="bg-white rounded-lg shadow-xl relative max-w-3xl w-full mx-4 z-50">
              <CompletedLicense
                vendor={selectedVendor}
                closeModal={() => {
                  setShowCompletedModal(false);
                  setSelectedVendor(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;