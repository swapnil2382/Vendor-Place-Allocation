// src/pages/VendorDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [error, setError] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchVendorAndBooking = async () => {
      const token = localStorage.getItem("token");
      console.log("Token in VendorDashboard:", token);
      if (!token) {
        setError("No authentication token found. Please log in.");
        navigate("/login");
        return;
      }

      try {
        // Fetch vendor details
        const vendorRes = await axios.get(
          `http://localhost:5000/api/vendors/me?t=${Date.now()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(
          "Fetched vendor data:",
          JSON.stringify(vendorRes.data, null, 2)
        );
        setVendor(vendorRes.data);

        // Check if attendance was marked today
        const lastAttendance = vendorRes.data.lastAttendance
          ? new Date(vendorRes.data.lastAttendance)
          : null;
        const today = new Date();
        const isToday =
          lastAttendance &&
          lastAttendance.getDate() === today.getDate() &&
          lastAttendance.getMonth() === today.getMonth() &&
          lastAttendance.getFullYear() === today.getFullYear();
        setAttendanceMarked(isToday);

        // Fetch booking info (stall associated with this vendor)
        const stallRes = await axios.get(
          `http://localhost:5000/api/stalls/by-vendor/${
            vendorRes.data._id
          }?t=${Date.now()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(
          "Fetched booking info:",
          JSON.stringify(stallRes.data, null, 2)
        );
        setBookingInfo(stallRes.data);
      } catch (err) {
        console.error("Error fetching data:", err.response?.data || err);
        setError(
          "Failed to load dashboard data: " +
            (err.response?.data?.message || err.message)
        );
      }
    };

    fetchVendorAndBooking();
  }, [navigate, location]);

  const markAttendance = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/vendors/mark-attendance",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendanceMarked(true);
      setVendor({ ...vendor, lastAttendance: new Date() });
    } catch (error) {
      setError(
        "Error marking attendance: " +
          (error.response?.data?.message || error.message)
      );
      console.error("Error marking attendance:", error);
    }
  };

  const unbookStall = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/vendors/unbook-stall",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookingInfo(null);
      setVendor({ ...vendor, gpsCoordinates: null });
      console.log("Stall unbooked successfully from UI");
    } catch (error) {
      setError(
        "Error unbooking stall: " +
          (error.response?.data?.message || error.message)
      );
      console.error("Error unbooking stall:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6">
      <h2 className="text-2xl font-bold text-center mb-6">Vendor Dashboard</h2>
      {error && <p className="text-red-500">{error}</p>}
      {vendor ? (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">
              Vendor Details
            </h3>
            <p>
              <strong>Name:</strong> {vendor.name}
            </p>
            <p>
              <strong>Shop ID:</strong> {vendor.shopID}
            </p>
            <p>
              <strong>Assigned Spot:</strong>{" "}
              {vendor.gpsCoordinates || "Not yet assigned (Go to Find Spaces)"}
            </p>
            <p>
              <strong>Last Attendance:</strong>{" "}
              {vendor.lastAttendance
                ? new Date(vendor.lastAttendance).toLocaleString()
                : "Not marked"}
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">
              Booking Information
            </h3>
            {bookingInfo ? (
              <div>
                <p>
                  <strong>Stall Name:</strong> {bookingInfo.name}
                </p>
                <p>
                  <strong>Coordinates:</strong> {bookingInfo.lat},{" "}
                  {bookingInfo.lng}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {bookingInfo.taken ? "Booked" : "Not Booked"}
                </p>
                <button
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  onClick={unbookStall}
                >
                  Cancel Stall Booking
                </button>
              </div>
            ) : (
              <p>No stall booked yet. Go to Find Spaces to book a stall.</p>
            )}
          </div>

          <button
            className={`w-full py-2 rounded-md text-white font-semibold ${
              attendanceMarked
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            onClick={markAttendance}
            disabled={attendanceMarked}
          >
            {attendanceMarked ? "Attendance Marked" : "Mark Attendance"}
          </button>
        </div>
      ) : (
        <p className="text-center text-gray-600">Loading vendor details...</p>
      )}
    </div>
  );
}

export default VendorDashboard;
