import axiosInstance from "../api/axios";

export const loginApi = async (data) => {
  const response = await axiosInstance.post("/auth/login", data);
  return response.data;  
};

export const refreshTokenApi =
  async () => {
    const response =
      await axiosInstance.post(
        "/auth/refresh-token"
      );

    return response.data;
  };

export const logoutApi =
  async () => {
    const response =
      await axiosInstance.post(
        "/auth/logout"
      );

    return response.data;
  };

export const getMeApi = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;  // ye return karta hai: { success, message, data: { user } }
};