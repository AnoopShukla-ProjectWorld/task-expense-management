import axiosInstance from "../api/axios";

export const getAdminDashboardStats = async () => {
  const response = await axiosInstance.get("/reports/dashboard/admin");
  return response.data.data;
};

export const getAuditLogs = async (params = {}) => {
  const response = await axiosInstance.get("/audit", { params });
  return response.data.data;
};

export const getTaskAnalytics = async (params) => {
  const response = await axiosInstance.get("/reports/tasks", { params });
  return response.data.data;
};

export const getExpenseAnalytics = async (params) => {
  const response = await axiosInstance.get("/reports/expenses", { params });
  return response.data.data;
};

export const getProjectAnalytics = async () => {
  const response = await axiosInstance.get("/reports/projects");
  return response.data.data;
};

export const getUserProductivity = async (params = {}) => {
  const response = await axiosInstance.get("/reports/productivity", { params });
  return response.data.data;
};

export const exportCSV = async (params = {}) => {
  const response = await axiosInstance.get("/reports/export/csv", {
    params,
    responseType: "blob",
  });
  return response.data;
};

export const exportExcel = async (params = {}) => {
  const response = await axiosInstance.get("/reports/export/excel", {
    params,
    responseType: "blob",
  });
  return response.data;
};