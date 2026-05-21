import axiosInstance from "../api/axios";

export const getProjects = async () => {
  const response = await axiosInstance.get("/projects");
  return response.data.data;
};

export const createProject = async (data) => {
  const response = await axiosInstance.post("/projects", data);
  return response.data;
};

export const updateProject = async (id, data) => {
  const response = await axiosInstance.put(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await axiosInstance.delete(`/projects/${id}`);
  return response.data;
};