import axiosInstance from "../api/axios";

export const getAdminDashboardStats = async () => {
  const response = await axiosInstance.get("/reports/dashboard/admin");
  return response.data.data;
};

export const getAuditLogs = async () => {
  const response = await axiosInstance.get("/audit");
  return response.data.data;
};