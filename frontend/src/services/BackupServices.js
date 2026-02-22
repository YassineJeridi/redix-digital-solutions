import api from './api';

const URL = '/api/backup';

/** Get last backup info + next scheduled time */
export const getBackupStatus = async () => {
    const { data } = await api.get(`${URL}/status`);
    return data;
};

/** Get backup audit-log history */
export const getBackupHistory = async () => {
    const { data } = await api.get(`${URL}/history`);
    return data;
};

/** Manually trigger a full backup */
export const triggerBackup = async () => {
    const { data } = await api.post(`${URL}/trigger`);
    return data;
};
