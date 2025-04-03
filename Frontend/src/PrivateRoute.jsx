// src/PrivateRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const PrivateRoute = ({ role }) => {
  const { token, role: userRole } = useAuth();
  const storedToken = localStorage.getItem("token");
  const storedRole = localStorage.getItem("role");

  console.log("PrivateRoute - Context token:", token, "Stored token:", storedToken);
  console.log("PrivateRoute - Expected role:", role, "Context role:", userRole, "Stored role:", storedRole);

  const effectiveToken = token || storedToken;
  const effectiveRole = userRole || storedRole;

  if (!effectiveToken) {
    console.log("Redirecting to /login - No token found");
    return <Navigate to="/" replace />;
  }
  if (effectiveRole !== role) {
    console.log(`Redirecting to /login - Role mismatch: ${effectiveRole} !== ${role}`);
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;