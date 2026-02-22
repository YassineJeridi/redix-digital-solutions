import api from './api';

const API_URL = '/api/tools';

export const getTools = async (params = {}) => {
    const { data } = await api.get(API_URL, { params });
    return data;
};

export const getToolById = async (id) => {
    const { data } = await api.get(`${API_URL}/${id}`);
    return data;
};

export const createTool = async (toolData) => {
    const { data } = await api.post(API_URL, toolData);
    return data;
};

export const updateTool = async (id, toolData) => {
    const { data } = await api.put(`${API_URL}/${id}`, toolData);
    return data;
};

export const deleteTool = async (id) => {
    const { data } = await api.delete(`${API_URL}/${id}`);
    return data;
};
