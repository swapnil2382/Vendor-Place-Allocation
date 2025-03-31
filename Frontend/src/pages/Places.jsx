// src/pages/Places.jsx
import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Rectangle,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Places = () => {
  const center = [19.066435205235848, 72.99389000336194];
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);
  const [bookingReceipt, setBookingReceipt] = useState(null);
  const [bookingError, setBookingError] = useState(null); // New state for booking error
  const navigate = useNavigate();

  const metersToLatLng = (meters) => meters / 111000;
  const squareSize = metersToLatLng(5);

  useEffect(() => {
    const fetchStalls = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Token in Places:", token);
        const response = await axios.get("http://localhost:5000/api/stalls", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Fetched stalls:", response.data);
        setStalls(response.data);
        setLoading(false);
      } catch (err) {
        setError(
          "Failed to fetch stalls: " +
            (err.response?.data?.message || err.message)
        );
        console.error("Error fetching stalls:", err);
        setLoading(false);
      }
    };
    fetchStalls();
  }, []);

  const handleStallClick = (stall) => {
    console.log("Stall clicked:", stall);
    if (!stall.taken) {
      console.log("Vacant stall selected:", stall._id);
      setSelectedStall(stall);
      console.log("Selected stall set to:", stall);
      setBookingError(null); // Clear any previous booking error
    }
  };

  const confirmBooking = async () => {
    const token = localStorage.getItem("token");
    console.log(
      "Confirming booking for stall:",
      selectedStall._id,
      "with token:",
      token
    );
    if (!token) {
      setError("Please log in to book a stall");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/vendors/claim-stall/${selectedStall._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Stall booked response:", response.data);
      setBookingReceipt({
        stallName: response.data.stall.name,
        coordinates: `${response.data.stall.lat},${response.data.stall.lng}`,
        bookingDate: new Date().toLocaleString(),
        vendorId: response.data.stall.vendorID,
      });
      setStalls((prevStalls) =>
        prevStalls.map((stall) =>
          stall._id === selectedStall._id ? { ...stall, taken: true } : stall
        )
      );
      setSelectedStall(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      console.error("Error booking stall:", err.response?.data || err);
      if (err.response?.status === 400 && err.response?.data?.currentStall) {
        setBookingError({
          message: errorMessage,
          currentStall: err.response.data.currentStall,
        });
      } else {
        setError("Failed to book stall: " + errorMessage);
        setSelectedStall(null);
      }
    }
  };

  const MapEvents = () => {
    const map = useMapEvents({
      click: () => map.invalidateSize(),
    });
    return null;
  };

  if (loading)
    return (
      <p className="text-center text-gray-600">Loading available spaces...</p>
    );
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Find Available Spaces
      </h1>
      <p className="mb-6 text-gray-600">
        Click a vacant (red) stall to book it for your shop
      </p>
      <div className="w-full max-w-5xl h-[600px] shadow-xl rounded-lg overflow-hidden relative z-0">
        <MapContainer
          center={center}
          zoom={18}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapEvents />
          {stalls.map((stall) => (
            <Rectangle
              key={stall._id}
              bounds={[
                [stall.lat, stall.lng],
                [stall.lat + squareSize, stall.lng + squareSize],
              ]}
              color={stall.taken ? "green" : "red"}
              weight={2}
              fillOpacity={0.5}
              eventHandlers={{
                click: () => handleStallClick(stall),
              }}
            >
              <Tooltip>{stall.taken ? "Taken" : "Available"}</Tooltip>
            </Rectangle>
          ))}
        </MapContainer>
      </div>

      {selectedStall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 z-50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Confirm Stall Booking
            </h2>
            <p>
              <strong>Stall Name:</strong> {selectedStall.name}
            </p>
            <p>
              <strong>Coordinates:</strong> {selectedStall.lat},{" "}
              {selectedStall.lng}
            </p>
            {bookingError ? (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                <p>{bookingError.message}</p>
                <p className="mt-2">
                  <strong>Currently Booked Stall:</strong>{" "}
                  {bookingError.currentStall.name}
                </p>
                <p>
                  <strong>Coordinates:</strong> {bookingError.currentStall.lat},{" "}
                  {bookingError.currentStall.lng}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">
                Click "Confirm" to book this stall.
              </p>
            )}
            <div className="mt-6 flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                onClick={() => {
                  setSelectedStall(null);
                  setBookingError(null);
                }}
              >
                Cancel
              </button>
              {!bookingError && (
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  onClick={confirmBooking}
                >
                  Confirm Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {bookingReceipt && (
        <div className="mt-6 w-full max-w-5xl bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Booking Receipt
          </h2>
          <div className="space-y-2">
            <p>
              <strong>Stall Name:</strong> {bookingReceipt.stallName}
            </p>
            <p>
              <strong>Coordinates:</strong> {bookingReceipt.coordinates}
            </p>
            <p>
              <strong>Booking Date:</strong> {bookingReceipt.bookingDate}
            </p>
            <p>
              <strong>Vendor ID:</strong> {bookingReceipt.vendorId}
            </p>
          </div>
          <div className="mt-4 flex justify-end space-x-4">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => window.print()}
            >
              Print Receipt
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() =>
                navigate("/vendor-dashboard", {
                  replace: true,
                  state: { refresh: true },
                })
              }
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Places;
