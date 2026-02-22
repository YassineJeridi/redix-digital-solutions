import AuditLog from '../models/AuditLog.js';

// Get all audit logs with filters and pagination
export const getAuditLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            entityType = '',
            action = '',
            startDate = '',
            endDate = '',
            search = ''
        } = req.query;

        let query = {};

        if (entityType) query.entityType = entityType;
        if (action) query.action = action;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const total = await AuditLog.countDocuments(query);

        let logs = await AuditLog.find(query)
            .populate('performedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Apply search filter on populated data
        if (search) {
            const searchLower = search.toLowerCase();
            logs = logs.filter(log =>
                (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower)) ||
                (log.performedBy?.name && log.performedBy.name.toLowerCase().includes(searchLower)) ||
                log.entityType.toLowerCase().includes(searchLower) ||
                log.action.toLowerCase().includes(searchLower)
            );
        }

        res.json({
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get audit stats
export const getAuditStats = async (req, res) => {
    try {
        const totalLogs = await AuditLog.countDocuments();

        const byEntityType = await AuditLog.aggregate([
            { $group: { _id: '$entityType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const byAction = await AuditLog.aggregate([
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Recent activity (last 24h)
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentCount = await AuditLog.countDocuments({ createdAt: { $gte: last24h } });

        res.json({
            totalLogs,
            recentCount,
            byEntityType,
            byAction
        });
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({ message: error.message });
    }
};

// Clear old audit logs (admin only)
export const clearOldLogs = async (req, res) => {
    try {
        const { olderThanDays = 90 } = req.body;
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

        const result = await AuditLog.deleteMany({ createdAt: { $lt: cutoffDate } });

        res.json({
            message: `Deleted ${result.deletedCount} audit logs older than ${olderThanDays} days`
        });
    } catch (error) {
        console.error('Error clearing audit logs:', error);
        res.status(500).json({ message: error.message });
    }
};
