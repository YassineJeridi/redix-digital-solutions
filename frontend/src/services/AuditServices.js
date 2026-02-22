import api from './api';

const API_URL = '/api/audit';

export const getAuditLogs = async (params = {}) => {
    const response = await api.get(API_URL, { params });
    return response.data;
};

export const getAuditStats = async () => {
    const response = await api.get(`${API_URL}/stats`);
    return response.data;
};

export const clearOldLogs = async (olderThanDays = 90) => {
    const response = await api.delete(`${API_URL}/clear`, { data: { olderThanDays } });
    return response.data;
};
