import Notification from '../models/Notification.js';

/**
 * Create a notification — import and call from anywhere in the backend.
 *
 * @param {ObjectId|String} recipientId  - Who receives the notification
 * @param {String}          message      - Human-readable text
 * @param {String}          [type]       - 'info' | 'warning' | 'success'  (default: 'info')
 * @param {ObjectId|String} [relatedId]  - Optional linked entity (project / task / etc.)
 * @returns {Promise<Document|null>}
 */
export const createNotification = async (
    recipientId,
    message,
    type = 'info',
    relatedId = null
) => {
    try {
        const notification = await Notification.create({
            recipient: recipientId,
            message,
            type,
            relatedId,
        });
        return notification;
    } catch (error) {
        console.error('createNotification error:', error.message);
        return null;
    }
};
