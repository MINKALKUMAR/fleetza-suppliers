import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

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

// True when the backend could not be reached or is down (network error, gateway error, or HTML fallback page)
export const isServerUnavailableError = (error) => {
  if (!error) return false;
  if (!error.response) return true;
  const { status, headers } = error.response;
  if ([502, 503, 504].includes(status)) return true;
  return String(headers?.['content-type'] || '').includes('text/html');
};

export const SERVER_UNAVAILABLE_MESSAGE =
  'The Fleetza server is not responding right now. Please try again in a few minutes or contact the admin.';

// Pings the backend health endpoint; resolves to true when the API is up
export const checkServerHealth = async () => {
  try {
    const response = await axiosClient.get('/health', { timeout: 15000 });
    return !String(response.headers?.['content-type'] || '').includes('text/html');
  } catch (error) {
    return !isServerUnavailableError(error);
  }
};

export default axiosClient;
