import axios from 'axios';

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

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
