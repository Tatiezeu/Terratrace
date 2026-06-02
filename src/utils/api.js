import axios from 'axios';
import { toast } from 'sonner';

const getBaseURL = () => {
    if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return `http://${hostname}:5001/api`;
        }
    }
    return 'http://localhost:5001/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// ─── Request Interceptor — inject auth token ────────────────────────────────
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
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            // Network error — no response received
            toast.error('Network error — please check your connection.', {
                id: 'network-error',
                duration: 4000,
            });
            return Promise.reject(error);
        }

        const { status } = error.response;

        if (status === 401) {
            // Unauthorized — clear session and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('terratrace-auth-storage');
            // Dispatch a custom event so AuthContext can react
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
