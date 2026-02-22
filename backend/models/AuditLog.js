import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete', 'status_change', 'payment_status_change', 'team_assignment', 'note_added', 'attachment_added', 'commission', 'withdrawal', 'profile_update', 'backup_triggered']
    },
    entityType: {
        type: String,
        required: true,
        enum: ['Service', 'Client', 'Tool', 'TeamMember', 'Charge', 'Expense', 'Investment', 'Profile', 'Task', 'Backup']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeamMember'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId
    },
    userName: {
        type: String,
        default: ''
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    oldValue: {
        type: mongoose.Schema.Types.Mixed
    },
    newValue: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, { timestamps: true });

// Index for efficient querying
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
