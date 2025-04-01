// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VendorDashboard from "./pages/VendorDashboard";
import VendorLocationPage from "./components/VendorLocation"; // Renamed for clarity
import LicenseApplicationPage from "./components/LicenseApplication"; // Renamed for clarity
import AdminDashboard from "./pages/AdminDashboard";
import PrivateRoute from "./PrivateRoute";
import Homepage from "./pages/HomePage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CompleteProfile from "./pages/CompleteProfile";
import Places from "./pages/Places";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Protected Vendor Routes */}
          <Route element={<PrivateRoute role="vendor" />}>
            <Route path="/vendor" element={<VendorDashboard />} />
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/location" element={<VendorLocationPage />} />
            <Route
              path="/vendor/license"
              element={<LicenseApplicationPage />}
            />
            <Route path="/places" element={<Places />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<PrivateRoute role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
