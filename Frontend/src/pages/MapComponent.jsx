// src/components/MapComponent.jsx
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Rectangle, Tooltip, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom green icon (for available spots)
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom red icon (for all taken)
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapComponent = ({ stalls }) => {
  const center = [19.066435205235848, 72.99389000336194];
  const mapRef = useRef();
  const [zoomLevel, setZoomLevel] = useState(18); // Track zoom level

  const metersToLatLng = (meters) => meters / 111000;
  const squareSize = metersToLatLng(5); // 5m x 5m square
  const hasEmptySpots = stalls.some(stall => !stall.taken);

  // Listen to zoom events
  const MapEvents = () => {
    useMapEvents({
      zoomend: (e) => {
        const newZoom = e.target.getZoom();
        setZoomLevel(newZoom);
        console.log('Zoom Changed To:', newZoom, 'Has Empty Spots:', hasEmptySpots);
      },
    });
    return null;
  };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize(); // Redraw map when stalls change
    }
  }, [stalls]);

  console.log('Rendering Stalls:', stalls.length, stalls);
  console.log('Current Zoom Level:', zoomLevel, 'Should Show Marker:', zoomLevel < 18);
  console.log('Tooltip Content:', hasEmptySpots ? 'Available Spots' : 'All Taken');

  return (
    <MapContainer
      center={center}
      zoom={18}
      scrollWheelZoom={true}
      className="w-full h-full"
      whenCreated={(map) => {
        mapRef.current = map;
        setZoomLevel(map.getZoom()); // Set initial zoom
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* Render individual stall squares */}
      {stalls.map((stall, index) => (
        <Rectangle
          key={index}
          bounds={[
            [stall.lat, stall.lng],
            [stall.lat + squareSize, stall.lng + squareSize],
          ]}
          color={stall.taken ? 'green' : 'red'}
          weight={2}
          fillOpacity={0.5}
        >
          <Tooltip permanent={false}>
            {stall.taken ? stall.name : 'Empty'}
          </Tooltip>
        </Rectangle>
      ))}
      {/* Listen for zoom events */}
      <MapEvents />
      {/* Common marker when zoomed out */}
      {zoomLevel < 18 && (
        <Marker
          position={center}
          icon={hasEmptySpots ? greenIcon : redIcon}
        >
          <Tooltip
            permanent={false} // Show only on hover
            direction="top" // Position above marker
            offset={[0, -10]} // Adjust position slightly above
            opacity={1} // Ensure visibility
          >
            {hasEmptySpots ? 'Available Spots' : 'All Taken'}
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
};

export default MapComponent;