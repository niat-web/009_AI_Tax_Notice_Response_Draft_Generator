import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
  generateDraft: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/generate`, data);
    return response.data;
  },
  getHistory: async () => {
    const response = await axios.get(`${API_BASE_URL}/history`);
    return response.data;
  },
  getGeneration: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/history/${id}`);
    return response.data;
  },
  saveEdit: async (id, newText) => {
    const response = await axios.post(`${API_BASE_URL}/history/${id}/edit`, { newText });
    return response.data;
  },
  submitFeedback: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/feedback`, data);
    return response.data;
  },
  getAnalytics: async () => {
    const response = await axios.get(`${API_BASE_URL}/admin/analytics`);
    return response.data;
  },
  getTemplates: async () => {
    const response = await axios.get(`${API_BASE_URL}/templates`);
    return response.data;
  },
  addTemplate: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/templates`, data);
    return response.data;
  },
  deleteTemplate: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/templates/${id}`);
    return response.data;
  }
};
