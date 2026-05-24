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

export const getCaptchaApi = async () => {
  const response = await axiosInstance.get("/auth/captcha");
  return response.data;
};

export const verifyCaptchaApi = async (data) => {
  const response = await axiosInstance.post("/auth/verify-captcha", data);
  return response.data;
};

export const sendRegistrationOtpApi = async (data) => {
  const response = await axiosInstance.post("/auth/send-registration-otp", data);
  return response.data;
};

export const verifyRegistrationOtpApi = async (data) => {
  const response = await axiosInstance.post("/auth/verify-registration-otp", data);
  return response.data;
};

export const sendMobileOtpApi = async (data) => {
  const response = await axiosInstance.post("/auth/send-mobile-otp", data);
  return response.data;
};

export const verifyMobileOtpApi = async (data) => {
  const response = await axiosInstance.post("/auth/verify-mobile-otp", data);
  return response.data;
};

export const registerApi = async (data) => {
  const response = await axiosInstance.post("/auth/register", data);
  return response.data;
};

export const secureAdminLoginApi = async (data) => {
  const response = await axiosInstance.post("/auth/secure-admin-login", data);
  return response.data;
};

export const forgotPasswordApi = async (data) => {
  const response = await axiosInstance.post("/auth/forgot-password", data);
  return response.data;
};

export const resetPasswordApi = async (data) => {
  const response = await axiosInstance.post("/auth/reset-password", data);
  return response.data;
};