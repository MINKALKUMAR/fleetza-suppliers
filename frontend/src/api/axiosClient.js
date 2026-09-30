import axios from 'axios';

// Production Railway Backend URL for Android App & native wrappers
const RAILWAY_BACKEND_URL = 'https://fleetza-suppliers-production.up.railway.app/api';

// Check if running inside native Android / Capacitor container or standard web
const isCapacitorOrNative =
  (typeof window !== 'undefined' && (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    window.location.hostname === 'localhost' && window.location.port === '' ||
    Boolean(window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform())
  ));

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (isCapacitorOrNative ? RAILWAY_BACKEND_URL : '/api');

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach JWT token if present
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fleetza_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized globally
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      // Don't auto-redirect if already on login page or if it's the login request itself
      if (!isLoginRequest && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('fleetza_token');
        localStorage.removeItem('fleetza_user');
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
