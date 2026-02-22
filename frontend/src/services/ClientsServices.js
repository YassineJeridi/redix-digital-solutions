import api from './api';

const CLIENTS_API = '/api/clients';

export const getClients = async () => {
    const response = await api.get(CLIENTS_API);
    return response.data;
};

export const createClient = async (clientData) => {
    const response = await api.post(CLIENTS_API, clientData);
    return response.data;
};

export const updateClient = async (id, clientData) => {
    const response = await api.put(`${CLIENTS_API}/${id}`, clientData);
    return response.data;
};

export const deleteClient = async (id) => {
    const response = await api.delete(`${CLIENTS_API}/${id}`);
    return response.data;
};
