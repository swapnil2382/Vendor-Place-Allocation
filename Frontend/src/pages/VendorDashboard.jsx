import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchVendorAndBooking = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const vendorRes = await axios.get(
        `http://localhost:5000/api/vendors/me?t=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setVendor(vendorRes.data);

      const lastAttendance = vendorRes.data.lastAttendance
        ? new Date(vendorRes.data.lastAttendance)
        : null;
      const stallRes = await axios.get(
        `http://localhost:5000/api/stalls/by-vendor/${
          vendorRes.data._id
        }?t=${Date.now()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookingInfo(stallRes.data);

      if (stallRes.data.bookingTime) {
        const bookingTime = new Date(stallRes.data.bookingTime);
        const deadline = new Date(bookingTime.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();
        const timeRemaining = deadline - now;
        if (timeRemaining > 0) {
          setTimeLeft(timeRemaining);
          setAttendanceMarked(lastAttendance && lastAttendance > bookingTime);
        } else if (!lastAttendance || lastAttendance < bookingTime) {
          await unbookStall();
        }
      }

      setError(null);
    } catch (err) {
      setError(
        "Failed to load dashboard data: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchVendorAndBooking();
  }, [fetchVendorAndBooking, location.pathname]);

  useEffect(() => {
    if (timeLeft && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1000) {
            clearInterval(timer);
            if (!attendanceMarked) unbookStall();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, attendanceMarked]);

  const markAttendance = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/vendors/mark-attendance",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAttendanceMarked(true);
      setVendor({ ...vendor, lastAttendance: new Date() });
      setTimeLeft(null);
    } catch (error) {
      setError(
        "Error marking attendance: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const unbookStall = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/vendors/unbook-stall",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBookingInfo(null);
      setVendor({ ...vendor, gpsCoordinates: null });
      setTimeLeft(null);
    } catch (error) {
      setError(
        "Error unbooking stall: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const formatTimeLeft = () => {
    if (!timeLeft) return "Time expired";
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6">
      <h2 className="text-2xl font-bold text-center mb-6">Vendor Dashboard</h2>

      {error && <p className="text-red-500 text-center">{error}</p>}
      {loading && !vendor ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : (
        vendor && (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="text-xl font-semibold">Vendor Details</h3>
              <p>
                <strong>Name:</strong> {vendor.name}
              </p>
              <p>
                <strong>Shop ID:</strong> {vendor.shopID}
              </p>
              <p>
                <strong>Assigned Spot:</strong>{" "}
                {vendor.gpsCoordinates || "Not assigned"}
              </p>
            </div>

            {bookingInfo && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-xl font-semibold">Booking Information</h3>
                <p>
                  <strong>Stall Name:</strong> {bookingInfo.name}
                </p>
                <p>
                  <strong>Coordinates:</strong> {bookingInfo.lat},{" "}
                  {bookingInfo.lng}
                </p>
                {timeLeft !== null && (
                  <div>
                    <p>
                      <strong>Time to Mark Attendance:</strong>{" "}
                      {formatTimeLeft()}
                    </p>
                    <button
                      onClick={markAttendance}
                      disabled={attendanceMarked || timeLeft <= 0}
                      className={`mt-2 px-4 py-2 rounded-md text-white ${
                        attendanceMarked || timeLeft <= 0
                          ? "bg-gray-400"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {attendanceMarked
                        ? "Attendance Marked"
                        : "Mark Attendance"}
                    </button>
                  </div>
                )}
                <button
                  onClick={unbookStall}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Cancel Booking
                </button>
              </div>
            )}

            <button
              onClick={() => navigate("/login")}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md mt-4"
            >
              Logout
            </button>
          </div>
        )
      )}
    </div>
  );
}

export default VendorDashboard;
