import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // We can't use useNavigate here easily outside of a component, 
      // but window.location is a fallback if needed, or we rely on AuthContext failing 
      // subsequently. 
      // For now, let's just clear token so next reload/check fails.
    }
    return Promise.reject(error);
  }
);


export default apiClient;
