import api from './api';

const BASE = '/api/upgrade';

// ── Wishlist Items ────────────────────────────────────────────
export const getUpgradeItems = async (params = {}) => {
    const { data } = await api.get(`${BASE}/items`, { params });
    return data;
};

export const createUpgradeItem = async (itemData) => {
    const { data } = await api.post(`${BASE}/items`, itemData);
    return data;
};

export const updateUpgradeItem = async (id, itemData) => {
    const { data } = await api.put(`${BASE}/items/${id}`, itemData);
    return data;
};

export const deleteUpgradeItem = async (id) => {
    const { data } = await api.delete(`${BASE}/items/${id}`);
    return data;
};

export const purchaseUpgradeItem = async (id, purchaseData) => {
    const { data } = await api.post(`${BASE}/items/${id}/purchase`, purchaseData);
    return data;
};

// ── Investment Fund ───────────────────────────────────────────
export const getUpgradeFund = async () => {
    const { data } = await api.get(`${BASE}/fund`);
    return data;
};

export const addFundDeposit = async (payload) => {
    const { data } = await api.post(`${BASE}/fund/deposit`, payload);
    return data;
};

export const subtractFund = async (payload) => {
    const { data } = await api.post(`${BASE}/fund/subtract`, payload);
    return data;
};
export const toggleFavoriteItem = async (id) => {
    const { data } = await api.patch(`${BASE}/items/${id}/favorite`);
    return data; // { isFavorite: bool }
};