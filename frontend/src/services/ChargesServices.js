import api from './api';

const API_URL = '/api/charges';

export const getCharges = async () => {
    const response = await api.get(API_URL);
    return response.data;
};

export const createCharge = async (chargeData) => {
    const response = await api.post(API_URL, chargeData);
    return response.data;
};

export const updateCharge = async (id, chargeData) => {
    const response = await api.put(`${API_URL}/${id}`, chargeData);
    return response.data;
};

export const deleteCharge = async (id) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
};
