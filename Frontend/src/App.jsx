import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VendorDashboard from "./pages/VendorDashboard";
import VendorLocationPage from "./components/VendorLocation";  // ✅ Import Location Page
import LicenseApplicationPage from "./components/LicenseApplication";  // ✅ Import License Page
import AdminDashboard from "./pages/AdminDashboard";
import PrivateRoute from "./PrivateRoute";
import Homepage from "./pages/HomePage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CompleteProfile from "./pages/CompleteProfile";

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
            <Route path="/vendor/location" element={<VendorLocationPage />} /> {/* ✅ Location Page */}
            <Route path="/vendor/license" element={<LicenseApplicationPage />} /> {/* ✅ License Page */}
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<PrivateRoute role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
