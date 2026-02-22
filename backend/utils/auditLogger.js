import AuditLog from '../models/AuditLog.js';

/**
 * Log an action to the audit log
 * @param {Object} data - The audit log data
 * @param {String} data.action - Action type (create, update, delete, etc.)
 * @param {String} data.entityType - Type of entity (Project, Client, etc.)
 * @param {ObjectId} data.entityId - ID of the entity
 * @param {ObjectId} data.performedBy - User who performed the action
 * @param {Object} [data.details] - Additional details
 * @param {Object} [data.oldValue] - Old value (for updates)
 * @param {Object} [data.newValue] - New value (for updates)
 * @param {Object} [req] - Express request object (optional, for IP and user agent)
 */
export const logAudit = async (data, req = null) => {
    try {
        const auditData = {
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId,
            performedBy: data.performedBy,
            details: data.details,
            oldValue: data.oldValue,
            newValue: data.newValue
        };

        // Add user attribution from the request
        if (req && req.user) {
            auditData.userId = req.user.id;
            auditData.userName = req.user.name || '';
            if (!auditData.performedBy) {
                auditData.performedBy = req.user.id;
            }
        }

        // Add IP and user agent if request is provided
        if (req) {
            auditData.ipAddress = req.ip || req.connection.remoteAddress;
            auditData.userAgent = req.get('user-agent');
        }

        const auditLog = new AuditLog(auditData);
        await auditLog.save();
        
        return auditLog;
    } catch (error) {
        console.error('Error logging audit:', error);
        // Don't throw error to prevent breaking the main operation
    }
};

/**
 * Get audit logs for a specific entity
 * @param {String} entityType - Type of entity
 * @param {ObjectId} entityId - ID of the entity
 * @param {Number} limit - Number of logs to return
 */
export const getEntityAuditLogs = async (entityType, entityId, limit = 50) => {
    try {
        const logs = await AuditLog.find({ entityType, entityId })
            .populate('performedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit);
        return logs;
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
};

/**
 * Get audit logs for a specific user
 * @param {ObjectId} userId - ID of the user
 * @param {Number} limit - Number of logs to return
 */
export const getUserAuditLogs = async (userId, limit = 50) => {
    try {
        const logs = await AuditLog.find({ performedBy: userId })
            .sort({ createdAt: -1 })
            .limit(limit);
        return logs;
    } catch (error) {
        console.error('Error fetching user audit logs:', error);
        return [];
    }
};
