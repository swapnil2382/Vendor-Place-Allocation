import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import VendorProfile from "../components/VendorProfile";
import ProductForm from "../components/ProductForm";
import ProductList from "../components/ProductList";
import VendorOrders from "../components/VendorOrders";
import LicenseApplication from "../components/LicenseApplication";

function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showOverview, setShowOverview] = useState(false);
  const [showLicensePopup, setShowLicensePopup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchVendorAndBooking = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication token not found. Please log in.");
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
        "Unable to retrieve dashboard data: " +
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendanceMarked(true);
      setVendor({ ...vendor, lastAttendance: new Date() });
      setTimeLeft(null);
    } catch (error) {
      setError(
        "Failed to record attendance: " +
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookingInfo(null);
      setVendor({ ...vendor, gpsCoordinates: null });
      setTimeLeft(null);
    } catch (error) {
      setError(
        "Failed to cancel stall reservation: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const formatTimeLeft = () => {
    if (!timeLeft) return "Deadline Expired";
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    return `${hours} hr ${minutes} min ${seconds} sec`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const openLicensePopup = () => {
    setShowLicensePopup(true);
  };

  const closeLicensePopup = () => {
    setShowLicensePopup(false);
  };

  return (
    <div className="w-[98%] h-screen bg-gray-100 flex flex-col font-sans mx-auto overflow-hidden scrollbar-hidden">
      <style>
        {`
          .scrollbar-hidden::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .popup-scroll::-webkit-scrollbar {
            display: none;
          }
          .popup-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      {/* Header */}
      <div className="relative bg-white shadow-md py-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center">
          Vendor Management Portal
        </h2>
        {vendor && (
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowOverview(!showOverview)}
              className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition-colors"
              aria-label="View Profile"
            >
              {vendor.name ? vendor.name.charAt(0).toUpperCase() : "V"}
            </button>
            {showOverview && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-10">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Vendor Overview
                  </h3>
                  <dl className="space-y-2 text-gray-700 text-sm">
                    <div>
                      <dt className="font-medium">Registered Name:</dt>
                      <dd>{vendor.name}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Vendor ID:</dt>
                      <dd>{vendor.shopID}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Assigned Location:</dt>
                      <dd>{vendor.gpsCoordinates || "Not Assigned"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Last Attendance:</dt>
                      <dd>
                        {vendor.lastAttendance
                          ? new Date(vendor.lastAttendance).toLocaleString()
                          : "Not Recorded"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium">License Status:</dt>
                      <dd>
                        <span
                          className={`font-semibold ${
                            vendor.license?.status === "not issued"
                              ? "text-gray-500"
                              : vendor.license?.status === "requested"
                              ? "text-yellow-600"
                              : vendor.license?.status === "completed"
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {vendor.license?.status === "not issued"
                            ? "Not Issued"
                            : vendor.license?.status === "requested"
                            ? "Pending Review"
                            : vendor.license?.status === "completed"
                            ? "Completed"
                            : "Active"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                  <button
                    className="mt-4 w-full bg-gray-600 text-white py-2 rounded font-medium hover:bg-gray-700 transition-colors"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <nav className="flex border-b-2 border-gray-200 bg-white shadow-sm">
        {[
          { id: "home", label: "Home" },
          { id: "dashboard", label: "Dashboard" },
          { id: "profile", label: "Vendor Profile" },
          { id: "location", label: "Location Management" },
          { id: "license", label: "License Details" },
          { id: "products", label: "Product Inventory" },
          { id: "add-product", label: "Register Product" },
          { id: "orders", label: "Order Management" },
        ].map((tab) => (
          <div className="bg-gray-200 p-[0.5%] w-full" key={tab.id}>
            <button
              className={`flex-1 py-4 text-sm font-medium text-gray-700 border-b-2 transition-colors w-full ${
                activeTab === tab.id
                  ? "bg-white shadow-md text-blue-700 rounded-md"
                  : "bg-gray-200 hover:bg-gray-300 border-transparent"
              }`}
              onClick={() => {
                setActiveTab(tab.id);
                setShowOverview(false);
              }}
            >
              {tab.label}
            </button>
          </div>
        ))}
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-hidden scrollbar-hidden">
        {loading && !vendor ? (
          <p className="text-center text-gray-600 text-lg">
            Retrieving vendor information...
          </p>
        ) : (
          <div className="space-y-8">
            {/* Home Tab */}
            {activeTab === "home" && vendor && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                  Welcome, {vendor.name}
                </h3>
                <div className="space-y-6">
                  <section>
                    <h4 className="text-xl font-medium text-gray-700 mb-2">
                      About VendorSync Portal
                    </h4>
                    <p className="text-gray-600">
                      Welcome to VendorSync, your one-stop solution for managing
                      your vending business efficiently...
                    </p>
                  </section>
                  <section>
                    <h4 className="text-xl font-medium text-gray-700 mb-2">
                      Key Features
                    </h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li><strong>Stall Management:</strong> Reserve and manage...</li>
                      <li><strong>Order Tracking:</strong> Monitor customer orders...</li>
                      <li><strong>Product Inventory:</strong> Add, update, and remove...</li>
                      <li><strong>License Compliance:</strong> Apply for and track...</li>
                      <li><strong>Attendance System:</strong> Record daily attendance...</li>
                    </ul>
                  </section>
                  <section>
                    <h4 className="text-xl font-medium text-gray-700 mb-2">
                      Why Choose Us?
                    </h4>
                    <p className="text-gray-600">
                      VendorSync is built with vendors in mind...
                    </p>
                  </section>
                </div>
              </div>
            )}

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && vendor && (
              <div className="space-y-6">
                {bookingInfo && (
                  <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Stall Reservation Details
                    </h3>
                    <dl className="grid grid-cols-1 gap-4 text-gray-700">
                      <div>
                        <dt className="font-medium">Stall Designation:</dt>
                        <dd>{bookingInfo.name}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Coordinates:</dt>
                        <dd>{bookingInfo.lat}, {bookingInfo.lng}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Reservation Status:</dt>
                        <dd>{bookingInfo.taken ? "Confirmed" : "Not Confirmed"}</dd>
                      </div>
                    </dl>
                    {timeLeft !== null && (
                      <div className="mt-4">
                        <p className="text-gray-700">
                          <strong>Attendance Deadline:</strong> {formatTimeLeft()}
                        </p>
                        <button
                          onClick={markAttendance}
                          disabled={attendanceMarked || timeLeft <= 0}
                          className={`mt-4 px-6 py-2 rounded text-white font-medium transition-colors ${
                            attendanceMarked || timeLeft <= 0
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-blue-700 hover:bg-blue-800"
                          }`}
                        >
                          {attendanceMarked ? "Attendance Recorded" : "Record Attendance"}
                        </button>
                      </div>
                    )}
                    <button
                      className="mt-4 px-6 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
                      onClick={unbookStall}
                    >
                      Cancel Reservation
                    </button>
                  </section>
                )}
                <button
                  className={`w-full py-3 rounded text-white font-medium transition-colors ${
                    attendanceMarked
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-700 hover:bg-blue-800"
                  }`}
                  onClick={markAttendance}
                  disabled={attendanceMarked}
                >
                  {attendanceMarked ? "Attendance Recorded" : "Record Daily Attendance"}
                </button>
              </div>
            )}

            {/* Profile Details Tab */}
            {activeTab === "profile" && vendor && (
              <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                {vendor.isProfileComplete ? (
                  <VendorProfile vendor={vendor} />
                ) : (
                  <div className="text-center">
                    <p className="text-gray-700 mb-4">
                      Profile information is incomplete...
                    </p>
                    <button
                      className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded font-medium transition-colors"
                      onClick={() => navigate("/complete-profile")}
                    >
                      Complete Vendor Profile
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Location Tab */}
            {activeTab === "location" && (
              <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Location Management
                </h3>
                <dl className="grid grid-cols-1 gap-4 text-gray-700">
                  <div>
                    <dt className="font-medium">Assigned Location:</dt>
                    <dd>{vendor.gpsCoordinates || "Not Assigned"}</dd>
                  </div>
                  {bookingInfo && (
                    <>
                      <div>
                        <dt className="font-medium">Stall Designation:</dt>
                        <dd>{bookingInfo.name}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Coordinates:</dt>
                        <dd>{bookingInfo.lat}, {bookingInfo.lng}</dd>
                      </div>
                      <button
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
                        onClick={unbookStall}
                      >
                        Cancel Reservation
                      </button>
                    </>
                  )}
                </dl>
                <Link
                  to="/vendor/location"
                  className="mt-6 block text-center bg-blue-700 text-white py-2 rounded font-medium hover:bg-blue-800 transition-colors"
                >
                  Manage Location Preferences
                </Link>
              </section>
            )}

            {/* License Tab */}
            {activeTab === "license" && (
              <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  License Information
                </h3>
                <dl className="grid grid-cols-1 gap-4 text-gray-700">
                  <div>
                    <dt className="font-medium">Status:</dt>
                    <dd>
                      <span
                        className={`font-semibold ${
                          vendor.license?.status === "not issued"
                            ? "text-gray-500"
                            : vendor.license?.status === "requested"
                            ? "text-yellow-600"
                            : vendor.license?.status === "completed"
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {vendor.license?.status === "not issued"
                          ? "Not Issued"
                          : vendor.license?.status === "requested"
                          ? "Pending Review"
                          : vendor.license?.status === "completed"
                          ? "Completed"
                          : "Active"}
                      </span>
                    </dd>
                  </div>
                  {vendor.license?.licenseNumber && (
                    <div>
                      <dt className="font-medium">License Number:</dt>
                      <dd>{vendor.license.licenseNumber}</dd>
                    </div>
                  )}
                </dl>
                {vendor.license?.status === "completed" ? (
                  <button
                    onClick={openLicensePopup}
                    className="mt-6 block text-center bg-blue-700 text-white py-2 rounded font-medium hover:bg-blue-800 transition-colors w-full"
                  >
                    View License
                  </button>
                ) : (
                  <Link
                    to="/vendor/license"
                    className="mt-6 block text-center bg-blue-700 text-white py-2 rounded font-medium hover:bg-blue-800 transition-colors"
                  >
                    Apply for License
                  </Link>
                )}
              </section>
            )}

            {/* Products Tab */}
            {activeTab === "products" && <ProductList />}

            {/* Add Product Tab */}
            {activeTab === "add-product" && <ProductForm />}

            {/* Orders Tab */}
            {activeTab === "orders" && <VendorOrders />}
          </div>
        )}
      </div>

      {/* License Popup */}
      {showLicensePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative popup-scroll">
            <button
              onClick={closeLicensePopup}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-bold"
            >
              ×
            </button>
            <LicenseApplication vendor={vendor} />
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorDashboard;