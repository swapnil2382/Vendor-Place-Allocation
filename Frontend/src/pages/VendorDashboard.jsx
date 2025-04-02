// frontend/src/pages/VendorDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import VendorProfile from "../components/VendorProfile";
import ProductForm from "../components/ProductForm";
import ProductList from "../components/ProductList";
import VendorOrders from "../components/VendorOrders";

function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendor(vendorRes.data);
      console.log(vendorRes.data);

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

  const handleRetry = () => {
    fetchVendorAndBooking();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6">
      <h2 className="text-2xl font-bold text-center mb-6">Vendor Dashboard</h2>

      {/* Navigation Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${
            activeTab === "dashboard" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "products" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("products")}
        >
          My Products
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "add-product" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("add-product")}
        >
          Add Product
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "orders" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-center mb-4">
          <p>{error}</p>
          <button
            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}

      {loading && !vendor ? (
        <p className="text-center text-gray-600">Loading vendor details...</p>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && vendor && (
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
                  {vendor.gpsCoordinates || "Not yet assigned"}
                </p>
                <p>
                  <strong>Last Attendance:</strong>{" "}
                  {vendor.lastAttendance
                    ? new Date(vendor.lastAttendance).toLocaleString()
                    : "Not marked"}
                </p>
                <p>
                  <strong>License Status:</strong>{" "}
                  <span
                    className={`${
                      vendor.license?.status === "not issued"
                        ? "text-gray-500"
                        : vendor.license?.status === "requested"
                        ? "text-yellow-500"
                        : vendor.license?.status === "completed"
                        ? "text-green-500"
                        : "text-blue-500"
                    } font-semibold`}
                  >
                    {vendor.license?.status === "not issued"
                      ? "Not Issued"
                      : vendor.license?.status === "requested"
                      ? "Requested"
                      : vendor.license?.status === "completed"
                      ? "Completed"
                      : "Issued"}
                  </span>
                </p>
              </div>

              {bookingInfo && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Booking Information
                  </h3>
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
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    onClick={unbookStall}
                  >
                    Cancel Stall Booking
                  </button>
                </div>
              )}

              <Link
                to="/vendor/location"
                className="block text-center bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Manage Location
              </Link>

              <Link
                to="/vendor/license"
                className="block text-center bg-green-500 text-white p-2 rounded hover:bg-green-600"
              >
                {vendor.license?.status === "completed"
                  ? "View License"
                  : "Apply for License"}
              </Link>

              {vendor.isProfileComplete ? (
                <VendorProfile vendor={vendor} />
              ) : (
                <button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
                  onClick={() => navigate("/complete-profile")}
                >
                  Complete Profile
                </button>
              )}

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

              <button
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md mt-4"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && <ProductList />}

          {/* Add Product Tab */}
          {activeTab === "add-product" && <ProductForm />}

          {/* Orders Tab */}
          {activeTab === "orders" && <VendorOrders />}
        </>
      )}
    </div>
  );
}

export default VendorDashboard;
