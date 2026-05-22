import axiosInstance from "../api/axios";

export const getAdminDashboardStats = async () => {
  const response = await axiosInstance.get("/reports/dashboard/admin");
  return response.data.data;
};

export const getAuditLogs = async () => {
  const response = await axiosInstance.get("/audit");
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

export const getUserProductivity = async () => {
  const response = await axiosInstance.get("/reports/productivity");
  return response.data.data;
};

export const exportCSV = async () => {
  const response = await axiosInstance.get("/reports/export/csv", {
    responseType: "blob",
  });
  return response.data;
};

export const exportExcel = async () => {
  const response = await axiosInstance.get("/reports/export/excel", {
    responseType: "blob",
  });
  return response.data;
};