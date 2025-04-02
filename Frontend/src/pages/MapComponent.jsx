import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

const locationIcon = (isAvailable) =>
  L.icon({
    iconUrl: isAvailable
      ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png" // Green marker for available
      : "https://maps.google.com/mapfiles/ms/icons/red-dot.png", // Red marker for unavailable
    iconSize: [32, 32], // Size of the icon
    iconAnchor: [16, 32], // Anchor point of the icon (bottom center of the marker)
    popupAnchor: [0, -32], // Where the popup appears relative to the icon
  });

const stallIcon = (taken) =>
  L.divIcon({
    html: `<div style="background-color: ${
      taken ? "red" : "green"
    }; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });

const MapComponent = ({
  center,
  zoom,
  stalls = [], // Default to empty array
  locations = [], // New prop for pre-grouped locations
  onMapClick,
  onMarkerClick,
  selectedLocation,
  showLocations = false,
  showOnlyLocations = false,
  disableInteractions = false,
}) => {
  const MapEvents = () => {
    const map = useMap();

    useEffect(() => {
      if (disableInteractions) {
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        if (map.tap) map.tap.disable();
      } else {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
        if (map.tap) map.tap.enable();
      }
    }, [disableInteractions]);

    useMapEvents({
      click: (e) => {
        if (!disableInteractions && onMapClick) {
          onMapClick(e.latlng);
        }
      },
    });
    return null;
  };

  // Group stalls by locationName if showLocations is true and locations prop is not provided
  const groupedLocations =
    showLocations && !locations.length
      ? stalls.reduce((acc, stall) => {
          const { locationName, lat, lng } = stall;
          if (!acc[locationName]) {
            acc[locationName] = {
              stalls: [],
              totalLat: 0,
              totalLng: 0,
              count: 0,
            };
          }
          acc[locationName].stalls.push(stall);
          acc[locationName].totalLat += parseFloat(lat);
          acc[locationName].totalLng += parseFloat(lng);
          acc[locationName].count += 1;
          return acc;
        }, {})
      : {};

  const computedLocations = locations.length
    ? locations
    : showLocations
    ? Object.keys(groupedLocations).map((locationName) => {
        const { totalLat, totalLng, count, stalls } =
          groupedLocations[locationName];
        const avgLat = totalLat / count;
        const avgLng = totalLng / count;
        const isAvailable = stalls.some((stall) => !stall.taken);
        return { locationName, avgLat, avgLng, stalls, isAvailable };
      })
    : [];

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapEvents />

      {showLocations ? (
        <>
          {computedLocations.map((location) => (
            <Marker
              key={location.locationName}
              position={[location.avgLat, location.avgLng]}
              icon={locationIcon(location.isAvailable)}
              eventHandlers={{
                click: () =>
                  !disableInteractions &&
                  !showOnlyLocations &&
                  onMarkerClick &&
                  onMarkerClick(location),
              }}
            >
              <Popup>
                <strong>{location.locationName}</strong> <br />
                {location.isAvailable
                  ? "Available stalls"
                  : "All stalls booked"}
              </Popup>
              <div
                style={{
                  position: "absolute",
                  top: "-40px", // Position above the marker (adjusted for marker height)
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "white",
                  padding: "2px 5px",
                  borderRadius: "3px",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)", // Add a subtle shadow for better visibility
                  zIndex: 1000, // Ensure the label is above other map elements
                }}
              >
                {location.locationName}
              </div>
            </Marker>
          ))}

          {!showOnlyLocations &&
            selectedLocation &&
            groupedLocations[selectedLocation] &&
            groupedLocations[selectedLocation].stalls.map((stall) => (
              <Marker
                key={stall._id}
                position={[parseFloat(stall.lat), parseFloat(stall.lng)]}
                icon={stallIcon(stall.taken)}
                eventHandlers={{
                  click: () =>
                    !disableInteractions &&
                    onMarkerClick &&
                    onMarkerClick(stall),
                }}
              >
                <Popup>
                  <strong>Stall</strong> <br />
                  Status: {stall.taken ? "Booked" : "Available"} <br />
                  Coordinates: {stall.lat}, {stall.lng}
                </Popup>
              </Marker>
            ))}
        </>
      ) : (
        stalls.map((stall) => (
          <Marker
            key={stall._id}
            position={[parseFloat(stall.lat), parseFloat(stall.lng)]}
            icon={stallIcon(stall.taken)}
            eventHandlers={{
              click: () =>
                !disableInteractions && onMarkerClick && onMarkerClick(stall),
            }}
          >
            <Popup>
              <strong>Stall</strong> <br />
              Location: {stall.locationName} <br />
              Status: {stall.taken ? "Booked" : "Available"} <br />
              Coordinates: {stall.lat}, {stall.lng}
            </Popup>
          </Marker>
        ))
      )}
    </MapContainer>
  );
};

export default MapComponent;
