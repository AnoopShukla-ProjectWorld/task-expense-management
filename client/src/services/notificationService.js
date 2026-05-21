import axiosInstance from "../api/axios";

export const getNotifications = async () => {
  const response = await axiosInstance.get("/notifications");
  return response.data.data;
};

export const markAsRead = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}/read`);
  return response.data;
};