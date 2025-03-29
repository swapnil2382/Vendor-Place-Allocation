// src/App.jsx
import { useState, useEffect } from "react";
import MapComponent from "./pages/MapComponent";

function App() {
  const [stalls, setStalls] = useState([]);

  useEffect(() => {
    const fetchStalls = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/stalls");
        const data = await response.json();
        console.log("Fetched Stalls:", data);
        setStalls(data);
      } catch (err) {
        console.error("Error fetching stalls:", err);
      }
    };
    fetchStalls();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-gray-800 my-6">
        Weekly Market Stalls Map
      </h1>
      <div className="w-full max-w-5xl h-[600px] shadow-lg rounded-lg overflow-hidden">
        <MapComponent stalls={stalls} />
      </div>
    </div>
  );
}

export default App;
