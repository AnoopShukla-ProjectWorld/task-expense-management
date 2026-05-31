import axiosInstance from "../api/axios";

/**
 * Send chat message to Google Gemini-powered Enterprise AI Copilot backend endpoint
 * @param {string} message - The question or prompt typed by the Portal Administrator
 * @returns {Promise<Object>} - Contains response message and missingKey check properties
 */
export const askAICopilot = async (message) => {
  const response = await axiosInstance.post("/ai/chat", { message });
  return response.data.data;
};
