import api from "./api";

export const getDashboardStats = async (period = "all") => {
  const { data } = await api.get("/api/dashboard", { params: { period } });
  return data;
};
