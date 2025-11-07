import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'An error occurred';

    // Handle 401 - Unauthorized
    if (status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
      return Promise.reject(error);
    }

    // Handle 403 - Forbidden
    if (status === 403) {
      toast.error("Access denied. You don't have permission to perform this action.");
      return Promise.reject(error);
    }

    // Handle 404 - Not Found
    if (status === 404) {
      toast.error(message || 'Resource not found');
      return Promise.reject(error);
    }

    // Handle 409 - Conflict
    if (status === 409) {
      toast.error(message || 'This record already exists');
      return Promise.reject(error);
    }

    // Handle 422 - Validation Error
    if (status === 422) {
      toast.error('Please check your input and try again');
      return Promise.reject(error);
    }

    // Handle 500 - Server Error
    if (status >= 500) {
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Default error
    toast.error(message);
    return Promise.reject(error);
  }
);
