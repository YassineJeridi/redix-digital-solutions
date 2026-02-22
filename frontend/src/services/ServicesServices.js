import api from './api';

const API_URL = '/api/services';

// Get all services with filters, search, sort, and pagination
export const getServices = async (params = {}) => {
    const response = await api.get(API_URL, { params });
    return response.data;
};

// Get single service by ID
export const getServiceById = async (id) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
};

// Create new service
export const createService = async (serviceData) => {
    const response = await api.post(API_URL, serviceData);
    return response.data;
};

// Update service
export const updateService = async (id, serviceData) => {
    const response = await api.put(`${API_URL}/${id}`, serviceData);
    return response.data;
};

// Delete service
export const deleteService = async (id, confirmName) => {
    const response = await api.delete(`${API_URL}/${id}`, {
        data: { confirmName }
    });
    return response.data;
};

// Add note to service
export const addNote = async (id, content) => {
    const response = await api.post(`${API_URL}/${id}/notes`, { content });
    return response.data;
};

// Add attachment to service
export const addAttachment = async (id, attachmentData) => {
    const response = await api.post(`${API_URL}/${id}/attachments`, attachmentData);
    return response.data;
};

// Export to CSV
export const exportToCSV = async (filters = {}) => {
    const response = await api.get(`${API_URL}/export/csv`, {
        params: filters,
        responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `services-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

// Export to PDF
export const exportToPDF = async (filters = {}) => {
    const response = await api.get(`${API_URL}/export/pdf`, {
        params: filters,
        responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `services-${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

// Get service statistics
export const getServiceStats = async () => {
    const response = await api.get(`${API_URL}/stats`);
    return response.data;
};

// Inline status update (payment or service status)
export const updateServiceStatus = async (id, statusData) => {
    const response = await api.patch(`${API_URL}/${id}/status`, statusData);
    return response.data;
};

// Record a partial payment
export const recordPartialPayment = async (id, amount) => {
    const response = await api.post(`${API_URL}/${id}/partial-payment`, { amount });
    return response.data;
};

