// Centralized Axios instance for the whole application.
// All HTTP calls must go through the service layer (src/services/*).
// The base URL is configurable via the VITE_API_BASE_URL environment variable
// so the backend can later be swapped from JSON Server to Spring Boot
// without touching UI components.
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Return a promise that rejects with the given error.
// NOTE: `Promise.reject` does not exist in JavaScript (only `Promise.resolve`),
// so we build a rejected promise explicitly.
function rejectedWith(error) {
  return new Promise((_, reject) => reject(error));
}

// Attach the stored auth token to every request when available.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('billapp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => rejectedWith(error)
);

// Normalize error responses so callers receive a consistent, helpful error
// message. Network failures (no response) get special handling so users know
// the mock server must be running.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message;
    if (!error.response) {
      message =
        `Cannot connect to the API server at ${BASE_URL}. ` +
        'Make sure the mock server is running (run "npm start" from the bill folder to start both the API and frontend).';
    } else {
      message =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong. Please try again.';
    }
    return rejectedWith(new Error(message));
  }
);

export default api;