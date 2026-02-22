import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const parsed = JSON.parse(user);
                if (parsed.token) {
                    config.headers.Authorization = `Bearer ${parsed.token}`;
                }
            } catch {
                // Invalid stored data, ignore
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
