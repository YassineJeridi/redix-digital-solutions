import api from "./api";

export const getTransactions = async (params = {}) => {
  const { data } = await api.get("/api/ads", { params });
  return data;
};

export const getSummary = async (period = 30) => {
  const { data } = await api.get("/api/ads/summary", { params: { period } });
  return data;
};

export const createTransaction = async (payload) => {
  const { data } = await api.post("/api/ads", payload);
  return data;
};

export const updateTransaction = async (id, payload) => {
  const { data } = await api.put(`/api/ads/${id}`, payload);
  return data;
};

export const deleteTransaction = async (id) => {
  const { data } = await api.delete(`/api/ads/${id}`);
  return data;
};

export const getSettings = async () => {
  const { data } = await api.get("/api/ads/settings");
  return data;
};

export const updateSettings = async (payload) => {
  const { data } = await api.put("/api/ads/settings", payload);
  return data;
};

// ── Client Budgets ────────────────────────────────────────────────────────────

export const getClientBudgets = async () => {
  const { data } = await api.get("/api/ads/client-budgets");
  return data; // { clients: [...] }
};

export const upsertClientBudget = async (
  clientName,
  totalBudget,
  notes = "",
) => {
  const { data } = await api.put(
    `/api/ads/client-budgets/${encodeURIComponent(clientName)}`,
    { totalBudget, notes },
  );
  return data;
};

export const deleteClientBudget = async (clientName) => {
  const { data } = await api.delete(
    `/api/ads/client-budgets/${encodeURIComponent(clientName)}`,
  );
  return data;
};

export const resetClientBudget = async (clientName) => {
  const { data } = await api.post(
    `/api/ads/client-budgets/${encodeURIComponent(clientName)}/reset`,
  );
  return data;
};
