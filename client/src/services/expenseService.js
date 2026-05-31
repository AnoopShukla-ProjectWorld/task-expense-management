import axiosInstance from "../api/axios";

export const getExpenses = async (params = {}) => {
  const response = await axiosInstance.get("/expenses", { params });
  return response.data.data;
};

export const createExpense = async (data) => {
  const response = await axiosInstance.post("/expenses", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateExpense = async (id, data) => {
  const response = await axiosInstance.put(`/expenses/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await axiosInstance.delete(`/expenses/${id}`);
  return response.data;
};

export const reviewExpense = async (id, data) => {
  const response = await axiosInstance.patch(`/expenses/${id}/review`, data);
  return response.data;
};