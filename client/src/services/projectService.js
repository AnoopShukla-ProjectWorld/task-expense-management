import axiosInstance from "../api/axios";

export const getProjects = async (params = {}) => {
  const response = await axiosInstance.get("/projects", { params });
  return response.data.data;
};

export const createProject = async (data) => {
  const response = await axiosInstance.post("/projects", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateProject = async (id, data) => {
  const isFormData = data instanceof FormData;
  const config = isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  const response = await axiosInstance.put(`/projects/${id}`, data, config);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await axiosInstance.delete(`/projects/${id}`);
  return response.data;
};