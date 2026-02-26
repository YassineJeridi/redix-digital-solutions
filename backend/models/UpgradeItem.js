import mongoose from 'mongoose';

const upgradeItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: '' },
    category: { type: String, default: 'General' },
    productUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
        type: String,
        enum: ['wishlist', 'purchased'],
        default: 'wishlist'
    },
    quantity: { type: Number, default: 1, min: 1 },
    purchasedAt: { type: Date, default: null },
    purchasedAs: {
        type: String,
        enum: ['tool', 'subtool', ''],
        default: ''
    },
    purchasedToolRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tool',
        default: null
    },
    isFavorite: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('UpgradeItem', upgradeItemSchema);
