import axiosInstance from "../api/axios";

export const getTasks = async (params = {}) => {
  const response = await axiosInstance.get("/tasks", { params });
  return response.data.data;
};

export const createTask = async (data) => {
  const response = await axiosInstance.post("/tasks", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateTask = async (id, data) => {
  const isFormData = data instanceof FormData;
  const config = isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  const response = await axiosInstance.put(`/tasks/${id}`, data, config);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await axiosInstance.delete(`/tasks/${id}`);
  return response.data;
};

export const getTaskComments = async (taskId) => {
  const response = await axiosInstance.get(`/tasks/${taskId}/comments`);
  return response.data.data;
};

export const createTaskComment = async (taskId, commentText) => {
  const response = await axiosInstance.post(`/tasks/${taskId}/comments`, { comment: commentText });
  return response.data.data;
};