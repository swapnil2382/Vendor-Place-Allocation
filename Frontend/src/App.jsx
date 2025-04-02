// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VendorDashboard from "./pages/VendorDashboard";
import VendorLocationPage from "./components/VendorLocation";
import LicenseApplicationPage from "./components/LicenseApplication";
import AdminDashboard from "./pages/AdminDashboard";
import PrivateRoute from "./PrivateRoute";
import Homepage from "./pages/HomePage";

import Footer from "./components/Footer";
import CompleteProfile from "./pages/CompleteProfile";
import Places from "./pages/Places";
import PaymentPage from "./pages/PaymentPage";
import UserDashboard from "./pages/UserDashboard";

function App() {
  return (
    <>
   
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
          <Route path="/vendor/license" element={<LicenseApplicationPage />} />
          <Route path="/places" element={<Places />} />
          <Route path="/payment" element={<PaymentPage />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<PrivateRoute role="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Protected User Routes */}
        <Route element={<PrivateRoute role="user" />}>
          <Route path="/user" element={<UserDashboard />} />
        </Route>
      </Routes>
      <Footer />
    </>
  );
}

export default App;
