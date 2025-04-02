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

const StallSelectionMap = () => {
  const center = [19.066435205235848, 72.99389000336194];
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const metersToLatLng = (meters) => meters / 111000;
  const squareSize = metersToLatLng(5);

  useEffect(() => {
    const fetchStalls = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Token in StallSelectionMap:", token); // Debug
        const response = await axios.get("http://localhost:5000/api/stalls", {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  const claimStall = (stallId) => {
    const token = localStorage.getItem("token");
    console.log("Attempting to claim stall with token:", token); // Debug
    if (!token) {
      setError("Please log in to claim a stall");
      navigate("/login");
      return;
    }
    // Redirect to payment page with stallId in state
    navigate("/payment", { state: { stallId } });
  };

  const MapEvents = () => {
    const map = useMapEvents({
      click: () => map.invalidateSize(),
    });
    return null;
  };

  if (loading) return <p>Loading stalls...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Select Your Stall</h1>
      <p className="mb-4">
        Click an available (red) stall to proceed to payment
      </p>
      <div className="w-full max-w-5xl h-[600px] shadow-lg rounded-lg overflow-hidden">
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
                click: () => !stall.taken && claimStall(stall._id),
              }}
            >
              <Tooltip>{stall.taken ? "Taken" : "Available"}</Tooltip>
            </Rectangle>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default StallSelectionMap;
