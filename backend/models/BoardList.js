import mongoose from 'mongoose';

const boardListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'List name is required'],
        trim: true,
        unique: true
    },
    order: {
        type: Number,
        default: 0
    },
    color: {
        type: String,
        default: '#6b7280'
    },
    emoji: {
        type: String,
        default: '📋'
    }
}, { timestamps: true });

boardListSchema.index({ order: 1 });

export default mongoose.model('BoardList', boardListSchema);
