import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const RoleRoute = ({
  allowedRoles,
}) => {
  const { user } = useAuth();

  if (
    !allowedRoles.includes(
      user?.role
    )
  ) {
    return (
      <Navigate to="/unauthorized" />
    );
  }

  return <Outlet />;
};

export default RoleRoute;