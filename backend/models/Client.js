import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true
    },
    ownerName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    profileImage: {
        type: String,
        default: ''
    },
    notes: {
        type: String
    },
    matriculeFiscale: {
        type: String,
        default: ''
    },
    businessType: {
        type: String,
        enum: ['Restaurant', 'E-Commerce', 'Others', ''],
        default: ''
    },
    customBusinessType: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);
