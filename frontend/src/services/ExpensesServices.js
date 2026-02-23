import api from './api';

export const getExpenses = async (params = {}) => {
    const { data } = await api.get('/api/expenses', { params });
    return data;
};

export const createExpense = async (expenseData) => {
    const { data } = await api.post('/api/expenses', expenseData);
    return data;
};

export const updateExpense = async (id, expenseData) => {
    const { data } = await api.put(`/api/expenses/${id}`, expenseData);
    return data;
};

export const deleteExpense = async (id) => {
    const { data } = await api.delete(`/api/expenses/${id}`);
    return data;
};

export const getFinancialSummary = async (period = 'month') => {
    const { data } = await api.get('/api/expenses/summary', { params: { period } });
    return data;
};

export const addManualDeposit = async (amount, description) => {
    const { data } = await api.post('/api/expenses/deposit', { amount, description });
    return data;
};
