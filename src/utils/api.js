// BEHAVIOR: Configures Axios with automatic base URL detection, request/response interceptors, auth token injection, and global error toasts.
import axios from 'axios';
import { toast } from 'sonner';

// BEHAVIOR: Determines backend API server address dynamically based on frontend location (handles local vs remote networking)
const getBaseURL = () => {
    if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        // COLOR_THEME: Not directly style-related, but sets up connection point with backend
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return `http://${hostname}:5001/api`;
        }
    }
    return 'http://localhost:5001/api';
};

// BEHAVIOR: Instantiates configured Axios client
const api = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// ─── Request Interceptor — inject auth token ────────────────────────────────
// BACKEND_CONNECTION: Automatically intercepts every outgoing API request to append bearer JWT token headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// ─── Response Interceptor — centralized success & error handling ──────────────
// BACKEND_CONNECTION: Intercepts all backend API responses to detect and handle network failures, 401s, and 500s globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            // Network error — no response received from backend
            toast.error('Network error — please check your connection.', {
                id: 'network-error',
                duration: 4000,
            });
            return Promise.reject(error);
        }

        const { status } = error.response;

        if (status === 401) {
            // Unauthorized / expired token — clear session data and redirect to login page
            localStorage.removeItem('token');
            localStorage.removeItem('terratrace-auth-storage');
            // Dispatch a custom event so AuthContext can synchronize state
            window.dispatchEvent(new CustomEvent('auth-expired'));
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        } else if (status >= 500) {
            toast.error('Server error — please try again shortly.', {
                id: 'server-error',
                duration: 4000,
            });
        }

        return Promise.reject(error);
    }
);

export default api;
