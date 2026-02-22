import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TeamMember',
            required: true,
            index: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['info', 'warning', 'success'],
            default: 'info',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
    },
    { timestamps: true }
);

// Compound index for fast queries: "my unread, newest first"
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
