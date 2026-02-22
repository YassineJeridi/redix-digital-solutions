import api from './api';

const BASE = '/api/invoices';

export const getInvoices = async (params = {}) => {
    const response = await api.get(BASE, { params });
    return response.data;
};

export const getInvoice = async (id) => {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
};

export const createInvoice = async (data) => {
    const response = await api.post(BASE, data);
    return response.data;
};

export const updateInvoice = async (id, data) => {
    const response = await api.put(`${BASE}/${id}`, data);
    return response.data;
};

export const updateInvoiceStatus = async (id, status) => {
    const response = await api.patch(`${BASE}/${id}/status`, { status });
    return response.data;
};

export const deleteInvoice = async (id) => {
    const response = await api.delete(`${BASE}/${id}`);
    return response.data;
};

export const getInvoiceStats = async () => {
    const response = await api.get(`${BASE}/stats`);
    return response.data;
};

/**
 * Trigger a browser download for XML or PDF export.
 * Uses a hidden anchor with the bearer token forwarded via the URL approach
 * by fetching as blob and creating an object URL.
 */
const downloadBlob = async (url, filename) => {
    const response = await api.get(url, { responseType: 'blob' });
    const href = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
};

export const exportInvoiceXml = (id, invoiceNumber) =>
    downloadBlob(`${BASE}/${id}/export/xml`, `${invoiceNumber}.xml`);

export const exportInvoicePdf = (id, invoiceNumber) =>
    downloadBlob(`${BASE}/${id}/export/pdf`, `${invoiceNumber}.pdf`);

export const sendInvoiceTelegram = async (id, { botToken, chatId }) => {
    const response = await api.post(`${BASE}/${id}/send-telegram`, { botToken, chatId });
    return response.data;
};

