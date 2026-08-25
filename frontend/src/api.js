import axios from 'axios';

// Get current active user from localStorage
const getUserId = () => localStorage.getItem('userId');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const userId = getUserId();
  if (userId) {
    // Send userId as both header and query param to match our backend flexibility
    config.headers['x-user-id'] = userId;
    config.params = { ...config.params, userId };
  }
  return config;
});

export default api;

