import axiosInstance from "../api/axios";

export const getUsers = async (query = "") => {
  const params = typeof query === "string" ? { search: query } : query;
  const response = await axiosInstance.get("/users", { params });
  return response.data.data;
};

export const getUserById = async (id) => {
  const response = await axiosInstance.get(`/users/${id}`);
  return response.data.data;
};

export const createUser = async (data) => {
  const response = await axiosInstance.post("/users", data);
  return response.data.data;
};

export const updateUser = async (id, data) => {
  const response = await axiosInstance.put(`/users/${id}`, data);
  return response.data.data;
};

export const deleteUser = async (id) => {
  const response = await axiosInstance.delete(`/users/${id}`);
  return response.data;
};

export const getProfile = async () => {
  const response = await axiosInstance.get("/users/profile/me");
  return response.data.data;
};

export const updateProfile = async (data) => {
  const response = await axiosInstance.put("/users/profile/me", data);
  return response.data.data;
};

export const approveUser = async ({ id, role }) => {
  const response = await axiosInstance.put(`/users/${id}/approve`, { role });
  return response.data;
};

export const rejectUser = async (id) => {
  const response = await axiosInstance.put(`/users/${id}/reject`);
  return response.data;
};

export const suspendUser = async (id) => {
  const response = await axiosInstance.put(`/users/${id}/suspend`);
  return response.data;
};