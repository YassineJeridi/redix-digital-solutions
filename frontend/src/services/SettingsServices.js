import api from './api';
import axios from 'axios';

const TEAM_API = '/api/settings';

export const getTeamMembers = async () => {
    const response = await api.get(TEAM_API);
    return response.data;
};

export const createTeamMember = async (memberData) => {
    const response = await api.post(TEAM_API, memberData);
    return response.data;
};

export const updateTeamMember = async (id, memberData) => {
    const response = await api.put(`${TEAM_API}/${id}`, memberData);
    return response.data;
};

export const deleteTeamMember = async (id) => {
    const response = await api.delete(`${TEAM_API}/${id}`);
    return response.data;
};

export const addPaymentToMember = async (id, paymentData) => {
    const response = await api.post(`${TEAM_API}/${id}/payment`, paymentData);
    return response.data;
};

export const addAdvanceToMember = async (id, advanceData) => {
    const response = await api.post(`${TEAM_API}/${id}/advance`, advanceData);
    return response.data;
};

export const addWithdrawalToMember = async (id, withdrawalData) => {
    const response = await api.post(`${TEAM_API}/${id}/withdrawal`, withdrawalData);
    return response.data;
};

// ── Passkey ───────────────────────────────────────────────────
// Public — no token needed
export const verifyPasskey = async (passkey) => {
    const baseURL = import.meta.env.VITE_API_URL || '';
    const response = await axios.post(`${baseURL}/api/settings/verify-passkey`, { passkey });
    return response.data; // { valid: true/false }
};

export const updatePasskey = async (passkey, currentPasskey) => {
    const response = await api.put(`${TEAM_API}/passkey`, { passkey, currentPasskey });
    return response.data;
};

// ── Redix Caisse ──────────────────────────────────────────────
export const getCaisseBalance = async () => {
    const response = await api.get(`${TEAM_API}/caisse`);
    return response.data;
};

export const addCaisseDeposit = async (data) => {
    const response = await api.post(`${TEAM_API}/caisse/deposit`, data);
    return response.data;
};

export const addCaisseDeduction = async (data) => {
    const response = await api.post(`${TEAM_API}/caisse/deduct`, data);
    return response.data;
};

// ── Pending Earnings ──────────────────────────────────────────
export const adjustPendingEarnings = async (memberId, data) => {
    const response = await api.post(`${TEAM_API}/${memberId}/pending-earnings`, data);
    return response.data;
};
