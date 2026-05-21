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
    const originalRequest =
      error.config;

    if (
      error.response?.status ===
        401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise(
          (
            resolve,
            reject
          ) => {
            failedQueue.push({
              resolve,
              reject,
            });
          }
        )
          .then(() =>
            axiosInstance(
              originalRequest
            )
          )
          .catch((err) =>
            Promise.reject(err)
          );
      }

      originalRequest._retry =
        true;

      isRefreshing = true;

      try {
        await axiosInstance.post(
          "/auth/refresh-token"
        );

        processQueue(null);

        return axiosInstance(
          originalRequest
        );
      } catch (refreshError) {
        processQueue(
          refreshError,
          null
        );

        window.location.href =
          "/login";

        return Promise.reject(
          refreshError
        );
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;