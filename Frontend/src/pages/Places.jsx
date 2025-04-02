import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MapComponent from "./MapComponent";

const Places = () => {
  const center = [19.066435205235848, 72.99389000336194];
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);
  const [bookingReceipt, setBookingReceipt] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const navigate = useNavigate();

  // Add debug logging for stalls data
  useEffect(() => {
    if (stalls && stalls.length > 0) {
      console.log("Stalls for map:", stalls);
      console.log("Sample stall data structure:", stalls[0]);

      // Check if location names exist in the data
      const locationNames = new Set(stalls.map((stall) => stall.locationName));
      console.log("Available locations:", [...locationNames]);
    }
  }, [stalls]);

  useEffect(() => {
    const fetchStalls = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Token in Places:", token);
        const response = await axios.get("http://localhost:5000/api/stalls", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Fetched stalls:", response.data);

        // Ensure all stalls have required fields
        const validatedStalls = response.data
          .map((stall) => ({
            ...stall,
            // Ensure locationName exists (crucial for grouping)
            locationName: stall.locationName || "Unknown Location",
            // Ensure lat/lng are numbers
            lat:
              typeof stall.lat === "number" ? stall.lat : parseFloat(stall.lat),
            lng:
              typeof stall.lng === "number" ? stall.lng : parseFloat(stall.lng),
          }))
          .filter(
            (stall) =>
              // Filter out stalls with invalid coordinates
              !isNaN(stall.lat) && !isNaN(stall.lng)
          );

        console.log("Validated stalls:", validatedStalls);
        setStalls(validatedStalls);
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

  const handleLocationClick = (location) => {
    console.log("Location clicked:", location);
    setSelectedLocation(
      location.locationName === selectedLocation ? null : location.locationName
    );
    setSelectedStall(null);
    setBookingError(null);
  };

  const handleStallClick = (stall) => {
    console.log("Stall clicked:", stall);
    if (!stall.taken) {
      console.log("Vacant stall selected:", stall._id);
      setSelectedStall(stall);
      console.log("Selected stall set to:", stall);
      setBookingError(null);
    }
  };

  const confirmBooking = () => {
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

    navigate("/payment", { state: { stallId: selectedStall._id } });
    setSelectedStall(null);
  };

  if (loading)
    return (
      <p className="text-center text-gray-600">Loading available spaces...</p>
    );
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-gray-800 text-white p-5">
        <h2 className="text-2xl font-bold mb-6">Vendor Dashboard</h2>
        <ul>
          <li className="mb-4">
            <button
              className="w-full text-left py-2 px-4 bg-gray-700 rounded hover:bg-gray-600"
              onClick={() => navigate("/vendor-dashboard")}
            >
              Dashboard
            </button>
          </li>
          <li className="mb-4">
            <button
              className="w-full text-left py-2 px-4 bg-gray-700 rounded hover:bg-gray-600"
              onClick={() => navigate("/places")}
            >
              Find Stalls
            </button>
          </li>
          <li className="mb-4">
            <button
              className="w-full text-left py-2 px-4 bg-gray-700 rounded hover:bg-gray-600"
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
            >
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 relative">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Find Available Spaces
        </h1>
        <p className="mb-6 text-gray-600">
          Click a location marker to view available stalls. Green markers
          indicate available stalls, red markers indicate all stalls are booked.
        </p>

        {/* Display stall and location counts */}
        {stalls.length > 0 && (
          <div className="mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
            <p className="text-blue-700">
              <span className="font-medium">Available data:</span>{" "}
              {stalls.length} stalls across{" "}
              {new Set(stalls.map((s) => s.locationName)).size} locations
            </p>
          </div>
        )}

        <div className="w-full h-[600px] bg-white rounded-lg shadow-lg overflow-hidden relative z-10">
          <MapComponent
            center={center}
            zoom={18}
            stalls={stalls}
            onMarkerClick={(item) => {
              console.log("Marker clicked:", item);
              if (item.stalls) {
                handleLocationClick(item);
              } else {
                handleStallClick(item);
              }
            }}
            selectedLocation={selectedLocation}
            showLocations={true} // Ensure this is true to show location markers
          />
        </div>

        {selectedStall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 z-50">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Confirm Stall Selection
              </h2>
              <p>
                <strong>Location:</strong> {selectedStall.locationName}
              </p>
              <p>
                <strong>Coordinates:</strong> {selectedStall.lat},{" "}
                {selectedStall.lng}
              </p>
              {bookingError ? (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                  <p>{bookingError.message}</p>
                  <p className="mt-2">
                    <strong>Currently Booked Stall:</strong> Coordinates:{" "}
                    {bookingError.currentStall.lat},{" "}
                    {bookingError.currentStall.lng}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  Click "Confirm" to proceed to payment and book this stall.
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
                    Confirm
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {bookingReceipt && (
          <div className="mt-6 w-full bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500 z-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Booking Receipt
            </h2>
            <div className="space-y-2">
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
    </div>
  );
};

export default Places;
