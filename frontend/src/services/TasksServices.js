import api from './api';

const API_URL = '/api/tasks';

export const getTasks = async () => {
    const response = await api.get(API_URL);
    return response.data;
};

export const getTaskById = async (id) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
};

export const createTask = async (taskData) => {
    const response = await api.post(API_URL, taskData);
    return response.data;
};

export const updateTask = async (id, taskData) => {
    const response = await api.put(`${API_URL}/${id}`, taskData);
    return response.data;
};

export const deleteTask = async (id) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
};

export const updateTaskStatus = async (id, status, order) => {
    const response = await api.patch(`${API_URL}/${id}/status`, { status, order });
    return response.data;
};

export const reorderTasks = async (tasks) => {
    const response = await api.patch(`${API_URL}/reorder`, { tasks });
    return response.data;
};

export const addComment = async (id, text, author) => {
    const response = await api.post(`${API_URL}/${id}/comments`, { text, author });
    return response.data;
};

// ── Board Lists ─────────────────────────────────────

export const getBoardLists = async () => {
    const response = await api.get(`${API_URL}/lists`);
    return response.data;
};

export const createBoardList = async (data) => {
    const response = await api.post(`${API_URL}/lists`, data);
    return response.data;
};

export const updateBoardList = async (id, data) => {
    const response = await api.put(`${API_URL}/lists/${id}`, data);
    return response.data;
};

export const deleteBoardList = async (id) => {
    const response = await api.delete(`${API_URL}/lists/${id}`);
    return response.data;
};

export const reorderBoardLists = async (lists) => {
    const response = await api.patch(`${API_URL}/lists/reorder`, { lists });
    return response.data;
};
