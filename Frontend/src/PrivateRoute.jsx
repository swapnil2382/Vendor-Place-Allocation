import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const PrivateRoute = ({ role }) => {
  const { token, role: userRole } = useAuth();

  if (!token || userRole !== role) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default PrivateRoute;
