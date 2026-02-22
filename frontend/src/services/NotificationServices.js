import api from './api';

const URL = '/api/notifications';

/** Fetch notifications for the logged-in user */
export const getNotifications = async () => {
    const { data } = await api.get(URL);
    return data; // { notifications, unreadCount }
};

/** Mark a single notification as read */
export const markAsRead = async (id) => {
    const { data } = await api.put(`${URL}/${id}/read`);
    return data;
};

/** Mark all notifications as read */
export const markAllAsRead = async () => {
    const { data } = await api.put(`${URL}/read-all`);
    return data;
};

/** Delete a notification */
export const deleteNotification = async (id) => {
    const { data } = await api.delete(`${URL}/${id}`);
    return data;
};
