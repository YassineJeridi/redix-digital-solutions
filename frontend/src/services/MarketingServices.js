import api from './api';

const API_URL = '/api/marketing';

export const getMarketingProjects = async () => {
    const response = await api.get(API_URL);
    return response.data;
};

export const createMarketingProject = async (projectData) => {
    const response = await api.post(API_URL, projectData);
    return response.data;
};

export const updateMarketingProject = async (id, projectData) => {
    const response = await api.put(`${API_URL}/${id}`, projectData);
    return response.data;
};

export const deleteMarketingProject = async (id) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
};
