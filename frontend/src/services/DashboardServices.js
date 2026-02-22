import api from './api';

export const getDashboardStats = async () => {
    const { data } = await api.get('/api/dashboard');
    return data;
};
