import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    author: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: 'Todo',
        required: true,
        trim: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeamMember'
    }],
    dueDate: {
        type: Date
    },
    order: {
        type: Number,
        default: 0
    },
    attachments: [{
        type: String
    }],
    comments: [commentSchema]
}, {
    timestamps: true
});

// Index for fast column queries
taskSchema.index({ status: 1, order: 1 });

export default mongoose.model('Task', taskSchema);
