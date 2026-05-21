import axiosInstance from "../api/axios";

export const getTasks = async () => {
  const response = await axiosInstance.get("/tasks");
  return response.data.data;
};

export const createTask = async (data) => {
  const response = await axiosInstance.post("/tasks", data);
  return response.data;
};

export const updateTask = async (id, data) => {
  const response = await axiosInstance.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await axiosInstance.delete(`/tasks/${id}`);
  return response.data;
};