// src/hooks/useFetchStalls.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const useFetchStalls = () => {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStalls = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No token found, redirecting to login");
          setError("Please log in to view stalls");
          navigate("/");
          return;
        }

        const response = await axios.get("http://localhost:5000/api/stalls", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStalls(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching stalls:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch stalls";
        setError(errorMessage);
        if (err.response?.status === 401) {
          navigate("/");
        }
        setLoading(false);
      }
    };

    fetchStalls();
  }, [navigate]);

  return { stalls, loading, error };
};

export default useFetchStalls;
