import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  // WAIT FOR AUTH RESTORE
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  // NOT LOGGED IN
  if (!isAuthenticated) {
    return (
      <Navigate to="/login" />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;