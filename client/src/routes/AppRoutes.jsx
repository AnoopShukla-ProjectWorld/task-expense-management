import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import { ROLES } from "../constants/roles";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import AdminLoginPage from "../pages/auth/AdminLoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import UnauthorizedPage from "../pages/auth/UnauthorizedPage";
import DashboardLayout from "../layouts/DashboardLayout";

import HomePage from "../pages/HomePage";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import UsersPage from "../pages/admin/UsersPage";
import AdminProjectsPage from "../pages/admin/ProjectsPage";
import ProjectCreatePage from "../pages/admin/ProjectCreatePage";
import AdminTasksPage from "../pages/admin/TasksPage";
import AdminTaskCreatePage from "../pages/admin/TaskCreatePage";
import AdminExpensesPage from "../pages/admin/ExpensesPage";
import ReportsPage from "../pages/admin/ReportsPage";
import AuditLogsPage from "../pages/admin/AuditLogsPage";
import UserApprovalPage from "../pages/admin/UserApprovalPage";

// Manager Pages
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import ManagerProjectsPage from "../pages/manager/ProjectsPage";
import TeamTaskPage from "../pages/manager/TeamTaskPage";
import TaskCreatePage from "../pages/manager/TaskCreatePage";
import ManagerExpensesPage from "../pages/manager/ManagerExpensesPage";

// Employee Pages
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import MyTaskPage from "../pages/employee/MyTaskPage";
import MyExpensesPage from "../pages/employee/MyExpensesPage";
import ExpenseDetailsPage from "../pages/employee/ExpenseDetailsPage";
import ProfilePage from "../pages/employee/ProfilePage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/secure-admin-login" element={<AdminLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* PROTECTED */}
      <Route element={<ProtectedRoute />}>

        {/* ADMIN */}
        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="approvals" element={<UserApprovalPage />} />
            <Route path="projects" element={<AdminProjectsPage />} />
            <Route path="projects/new" element={<ProjectCreatePage />} />
            <Route path="tasks" element={<AdminTasksPage />} />
            <Route path="tasks/new" element={<AdminTaskCreatePage />} />
            <Route path="expenses" element={<AdminExpensesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* MANAGER */}
        <Route element={<RoleRoute allowedRoles={[ROLES.MANAGER]} />}>
          <Route path="/manager" element={<DashboardLayout />}>
            <Route index element={<ManagerDashboard />} />
            <Route path="projects" element={<ManagerProjectsPage />} />
            <Route path="tasks" element={<TeamTaskPage />} />
            <Route path="tasks/new" element={<TaskCreatePage />} />
            <Route path="expenses" element={<ManagerExpensesPage />} />
            <Route path="expenses/:id" element={<ExpenseDetailsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* EMPLOYEE */}
        <Route element={<RoleRoute allowedRoles={[ROLES.EMPLOYEE]} />}>
          <Route path="/employee" element={<DashboardLayout />}>
            <Route index element={<EmployeeDashboard />} />
            <Route path="tasks" element={<MyTaskPage />} />
            <Route path="expenses" element={<MyExpensesPage />} />
            <Route path="expenses/:id" element={<ExpenseDetailsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

      </Route>

      {/* DEFAULT */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;