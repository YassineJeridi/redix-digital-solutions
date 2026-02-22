import api from './api';

const API_URL = '/api/financial';

export const getFinancialMetrics = async () => {
    const response = await api.get(API_URL);
    return response.data;
};

export const updateInvestmentReserve = async (amount, operation) => {
    const response = await api.put(`${API_URL}/investment`, { amount, operation });
    return response.data;
};

export const updateRedixCaisse = async (amount, description) => {
    const response = await api.put(`${API_URL}/caisse`, { amount, description });
    return response.data;
};
