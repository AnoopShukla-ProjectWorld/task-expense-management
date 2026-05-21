import axiosInstance from "../api/axios";

export const getExpenses = async () => {
  const response = await axiosInstance.get("/expenses");
  return response.data.data;
};

export const createExpense = async (data) => {
  const response = await axiosInstance.post("/expenses", data);
  return response.data;
};

export const updateExpense = async (id, data) => {
  const response = await axiosInstance.put(`/expenses/${id}`, data);
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await axiosInstance.delete(`/expenses/${id}`);
  return response.data;
};