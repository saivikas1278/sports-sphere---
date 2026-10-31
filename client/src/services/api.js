import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies if using them
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[API] Request:', { 
      url: config.url, 
      method: config.method, 
      hasToken: !!token,
      baseURL: config.baseURL
    });
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', { 
      url: response.config.url,
      status: response.status,
      data: response.data 
    });
    // Return the full response.data for consistency with backend format
    return response.data;
  },
  (error) => {
    console.error('[API] Response error details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      isNetworkError: error.code === 'NETWORK_ERROR' || error.message === 'Network Error'
    });

    // Handle specific error cases
    if (!error.response) {
      // Network error
      console.error('[API] Network error - server may be down');
      return Promise.reject({
        response: {
          data: {
            error: 'Unable to connect to server. Please check if the server is running.'
          }
        }
      });
    }

    // Handle token expiration
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized for URL:', error.config?.url);
      localStorage.removeItem('token');
      const isAuthCheck = error.config?.url?.includes('/auth/login') || 
                          error.config?.url?.includes('/auth/me') || 
                          error.config?.url?.includes('/auth/profile');
      if (!isAuthCheck && error.config?.headers?.Authorization && window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
