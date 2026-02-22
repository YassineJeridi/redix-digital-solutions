import mongoose from 'mongoose';

const subToolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    purchasePrice: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'retired'],
        default: 'active'
    }
});

const toolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    basePrice: { type: Number, default: 0, min: 0 },
    purchasePrice: { type: Number, required: true },
    revenueCounter: { type: Number, default: 0 },
    category: { type: String, required: true },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'retired'],
        default: 'active'
    },
    payoffPercentage: { type: Number, default: 0, min: 0, max: 100 },
    usageCount: { type: Number, default: 0 },
    lastUsed: { type: Date },
    subTools: [subToolSchema]
}, { timestamps: true });

// Auto-compute purchasePrice = basePrice + sum of subTools
toolSchema.pre('save', function (next) {
    const subToolsTotal = (this.subTools || []).reduce(
        (sum, st) => sum + ((st.purchasePrice || 0) * (st.quantity || 1)), 0
    );
    this.purchasePrice = (this.basePrice || 0) + subToolsTotal;
    next();
});

toolSchema.methods.calculatePayoff = function () {
    if (this.purchasePrice === 0) {
        this.payoffPercentage = 100;
    } else {
        this.payoffPercentage = Math.min((this.revenueCounter / this.purchasePrice) * 100, 100);
    }
    return this.payoffPercentage;
};

export default mongoose.model('Tool', toolSchema);
