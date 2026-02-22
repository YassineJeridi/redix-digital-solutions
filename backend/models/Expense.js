import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Tools', 'Salaries', 'Office', 'Marketing', 'Utilities', 'Other']
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeamMember'
    }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
