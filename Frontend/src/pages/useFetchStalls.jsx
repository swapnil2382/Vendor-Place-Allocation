// src/hooks/useFetchStalls.js
import { useState, useEffect } from "react";

const useFetchStalls = () => {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStalls = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/stalls");
        if (!response.ok) throw new Error("Failed to fetch stalls");

        const data = await response.json();
        console.log("Fetched Stalls:", data);
        setStalls(data);
      } catch (err) {
        console.error("Error fetching stalls:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStalls();
  }, []);

  return { stalls, loading, error };
};

export default useFetchStalls;
