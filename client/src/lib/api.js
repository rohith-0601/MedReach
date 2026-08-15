import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Recipients
export const getRecipients = (params) => api.get('/recipients', { params });
export const getRecipient = (id) => api.get(`/recipients/${id}`);
export const createRecipient = (data) => api.post('/recipients', data);
export const updateRecipient = (id, data) => api.put(`/recipients/${id}`, data);
export const deleteRecipient = (id) => api.delete(`/recipients/${id}`);
export const importRecipients = (formData) => api.post('/recipients/import', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Cohorts
export const getCohorts = () => api.get('/cohorts');
export const getCohort = (id) => api.get(`/cohorts/${id}`);
export const createCohort = (data) => api.post('/cohorts', data);
export const updateCohort = (id, data) => api.put(`/cohorts/${id}`, data);
export const deleteCohort = (id) => api.delete(`/cohorts/${id}`);
export const getCohortMembers = (id) => api.get(`/cohorts/${id}/members`);

// Programs
export const getPrograms = (params) => api.get('/programs', { params });
export const getProgram = (id) => api.get(`/programs/${id}`);
export const createProgram = (data) => api.post('/programs', data);
export const updateProgram = (id, data) => api.put(`/programs/${id}`, data);
export const deleteProgram = (id) => api.delete(`/programs/${id}`);
export const sendProgram = (id) => api.post(`/programs/${id}/send`);
export const trackEvent = (id, event) => api.post(`/programs/${id}/track`, { event });

// Analytics
export const getDashboardStats = () => api.get('/analytics/dashboard');
export const getProgramAnalytics = (id) => api.get(`/analytics/programs/${id}`);

// Chatbot
export const sendChatMessage = (message, mode, history) =>
  api.post('/chatbot', { message, mode, history });

// ML Service
export const predictEngagement = (data) => api.post('/ml/predict/engagement', data);
export const predictSubjectLine = (data) => api.post('/ml/predict/subject-line', data);
export const simulateABTest = (data) => api.post('/ml/simulate/ab-test', data);

export default api;
