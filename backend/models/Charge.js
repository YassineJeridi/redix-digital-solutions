import mongoose from 'mongoose';

const chargeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Internet', 'Transport', 'Utilities', 'Rent', 'Supplies', 'Equipment', 'Marketing', 'Other']
    },
    description: {
        type: String
    },
    frequency: {
        type: String,
        enum: ['one-time', 'daily', 'weekly', 'monthly', 'yearly'],
        default: 'one-time'
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled'],
        default: 'paid'
    }
}, { timestamps: true });

export default mongoose.model('Charge', chargeSchema);
