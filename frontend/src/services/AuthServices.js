import api from './api';

const AuthService = {
    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
            // Set default auth header
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
        return response.data;
    },

    register: async (name, email, password, role) => {
        const response = await api.post('/api/auth/register', { name, email, password, role });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getMe: async () => {
        const response = await api.get('/api/auth/me');
        return response.data;
    },

    isAuthenticated: () => {
        const user = localStorage.getItem('user');
        if (!user) return false;
        try {
            const parsed = JSON.parse(user);
            return !!parsed.token;
        } catch {
            return false;
        }
    },

    // Set auth header on app init
    initAuth: () => {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const parsed = JSON.parse(user);
                if (parsed.token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
                }
            } catch {
                localStorage.removeItem('user');
            }
        }
    },

    // Change password
    changePassword: async (currentPassword, newPassword) => {
        const response = await api.put('/api/auth/change-password', { currentPassword, newPassword });
        return response.data;
    }
};

export default AuthService;
