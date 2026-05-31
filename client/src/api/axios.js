import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    import.meta.env
      .VITE_API_BASE_URL,

  withCredentials: true,

  headers: {
    "Content-Type":
      "application/json",
  },
});

let isRefreshing = false;

let failedQueue = [];

const processQueue = (
  error,
  token = null
) => {
  failedQueue.forEach(
    (promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token);
      }
    }
  );

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Do not intercept if it is a login, secure-admin-login, refresh-token, or logout request
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/secure-admin-login") ||
      originalRequest.url?.includes("/auth/refresh-token") ||
      originalRequest.url?.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the access token using standard axios to avoid infinite recursion in interceptor
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Dispatch a global event so AuthContext can catch it and log the user out cleanly without page reloads
        const event = new CustomEvent("auth-session-expired");
        window.dispatchEvent(event);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;