import api from './api';

const REPORTS_API = '/api/reports';

export const getReports = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.serviceType) params.append('serviceType', filters.serviceType);
    if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    const response = await api.get(`${REPORTS_API}?${params.toString()}`);
    return response.data;
};

export const exportCSV = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.serviceType) params.append('serviceType', filters.serviceType);
    if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    const response = await api.get(`${REPORTS_API}/export/csv?${params.toString()}`, {
        responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const exportPDF = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.serviceType) params.append('serviceType', filters.serviceType);
    if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    const response = await api.get(`${REPORTS_API}/export/pdf?${params.toString()}`, {
        responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
