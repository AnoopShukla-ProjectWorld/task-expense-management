import axiosInstance from "../api/axios";

export const getUsers = async (search = "") => {
  const response = await axiosInstance.get(`/users?search=${search}`);
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