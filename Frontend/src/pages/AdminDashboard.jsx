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
import LicenseReview from "../components/LicenseReview";
import CompletedLicense from "../components/CompletedLicense";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [message, setMessage] = useState("");
  const [placementMode, setPlacementMode] = useState("free");
  const [gridSize, setGridSize] = useState(5);
  const [bulkPlacement, setBulkPlacement] = useState(false);
  const [bulkStart, setBulkStart] = useState(null);
  const [bulkEnd, setBulkEnd] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const createStall = async (lat, lng) => {
    try {
      const res = await api.post("/admin/create-stall", { lat, lng });
      setStalls((prevStalls) => [...prevStalls, res.data]);
      setMessage(t("stall_created"));
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      if (error.response?.status !== 401) {
        setMessage(t("error_creating_stall"));
      }
      console.error("Error creating stall:", error);
    }
  };

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
      const res = await api.post("/admin/create-stalls-bulk", {
        stalls: newStalls,
      });
      setStalls((prevStalls) => [...prevStalls, ...res.data]);
      setMessage(t("stalls_created", { count: res.data.length }));
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      if (error.response?.status !== 401) {
        setMessage(t("error_creating_bulk_stalls"));
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
    <div className="p-5">
      <h2 className="text-2xl font-bold text-gray-800">
        {t("admin_dashboard")}
      </h2>

      {message && (
        <div
          className={`mt-4 p-2 rounded text-center ${
            message.includes("Error")
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-4">
        <h3 className="font-semibold text-gray-700">{t("vendor_licenses")}</h3>
        {vendors.length === 0 ? (
          <p className="text-gray-500 mt-2">{t("no_vendors")}</p>
        ) : (
          <ul>
            {vendors.map((vendor) => (
              <li
                key={vendor._id}
                className="p-2 border-b flex justify-between"
              >
                <span>
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
        )}
      </div>

      <div className="mt-4">
        <button
          className="w-full max-w-xs py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          onClick={resetStalls}
        >
          {t("reset_stalls")}
        </button>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-gray-700">{t("manage_stalls")}</h3>
        <div className="flex space-x-4 mt-2">
          <div>
            <label className="mr-2">{t("placement_mode")}</label>
            <select
              value={placementMode}
              onChange={(e) => setPlacementMode(e.target.value)}
              className="p-1 border rounded"
            >
              <option value="free">{t("free_placement")}</option>
              <option value="grid">{t("grid_placement")}</option>
            </select>
          </div>
          {placementMode === "grid" && (
            <div>
              <label className="mr-2">{t("grid_size")}</label>
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
            <label className="mr-2">{t("bulk_placement")}</label>
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
            {t("clear_stalls")}
          </button>
        </div>
        <p className="mt-2 text-gray-600">
          {bulkPlacement
            ? t("bulk_placement_instructions")
            : t("single_placement_instructions")}
        </p>
      </div>

      <div className="mt-6 h-96">
        <h3 className="font-semibold text-gray-700">{t("stall_locations")}</h3>
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
                {t("status")}: {stall.taken ? t("booked") : t("available")}{" "}
                <br />
                {stall.taken && stall.vendorID && (
                  <>
                    {t("vendor_id")}: {stall.vendorID} <br />
                  </>
                )}
                {t("coordinates")}: {stall.lat}, {stall.lng} <br />
                <button
                  className="mt-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => deleteStall(stall._id)}
                >
                  {t("delete_stall")}
                </button>
              </Popup>
            </Marker>
          ))}
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
                  {t("shop_id")}: {vendor.shopID} <br />
                  {t("category")}: {vendor.category} <br />
                  {t("location")}: {vendor.location.lat}, {vendor.location.lng}
                </Popup>
              </Marker>
            ))}
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

      <div className="mt-4">
        <h3 className="font-semibold text-gray-700">{t("assign_locations")}</h3>
        {vendors.length === 0 ? (
          <p className="text-gray-500 mt-2">{t("no_vendors")}</p>
        ) : (
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
                  {vendor.location?.lat
                    ? t("reassign_location")
                    : t("assign_location")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showReviewModal && selectedVendor && (
        <LicenseReview
          vendor={selectedVendor}
          closeModal={() => {
            setShowReviewModal(false);
            setSelectedVendor(null);
          }}
          onApprove={handleApprove}
        />
      )}

      {showCompletedModal && selectedVendor && (
        <CompletedLicense
          vendor={selectedVendor}
          closeModal={() => {
            setShowCompletedModal(false);
            setSelectedVendor(null);
          }}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
