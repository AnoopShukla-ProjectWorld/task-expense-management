import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import { ROLES } from "../constants/roles";
import LoginPage from "../pages/auth/LoginPage";
import UnauthorizedPage from "../pages/auth/UnauthorizedPage";
import DashboardLayout from "../layouts/DashboardLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UsersPage from "../pages/admin/UsersPage";
import ProjectsPage from "../pages/admin/ProjectsPage";
import TasksPage from "../pages/admin/TasksPage";
import ExpensesPage from "../pages/admin/ExpensesPage";
import ReportsPage from "../pages/admin/ReportsPage";
import AuditLogsPage from "../pages/admin/AuditLogsPage";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";

const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* PROTECTED */}
      <Route element={<ProtectedRoute />}>

        {/* ADMIN */}
        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>
        </Route>

        {/* MANAGER */}
        <Route element={<RoleRoute allowedRoles={[ROLES.MANAGER]} />}>
          <Route path="/manager" element={<DashboardLayout />}>
            <Route index element={<ManagerDashboard />} />
          </Route>
        </Route>

        {/* EMPLOYEE */}
        <Route element={<RoleRoute allowedRoles={[ROLES.EMPLOYEE]} />}>
          <Route path="/employee" element={<DashboardLayout />}>
            <Route index element={<EmployeeDashboard />} />
          </Route>
        </Route>

      </Route>

      {/* DEFAULT */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRoutes;