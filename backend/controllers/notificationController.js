import Notification from '../models/Notification.js';

/**
 * GET /api/notifications
 * Fetch notifications for the currently logged-in user (newest first, limit 30).
 * Returns { notifications, unreadCount }.
 */
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ recipient: userId })
                .sort({ createdAt: -1 })
                .limit(30)
                .lean(),
            Notification.countDocuments({ recipient: userId, isRead: false }),
        ]);

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('getNotifications error:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read (only if it belongs to the current user).
 */
export const markRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        console.error('markRead error:', error);
        res.status(500).json({ message: 'Failed to mark notification as read' });
    }
};

/**
 * PUT /api/notifications/read-all
 * Mark every unread notification for the current user as read.
 */
export const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('markAllRead error:', error);
        res.status(500).json({ message: 'Failed to mark all as read' });
    }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification (only if it belongs to the current user).
 */
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user.id,
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('deleteNotification error:', error);
        res.status(500).json({ message: 'Failed to delete notification' });
    }
};
