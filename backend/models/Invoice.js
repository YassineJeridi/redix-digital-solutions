import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    quantity:    { type: Number, required: true, min: 0 },
    unitPrice:   { type: Number, required: true, min: 0 },
    total:       { type: Number, default: 0 },
}, { _id: true });

// Auto-calc total before saving/validating
lineItemSchema.pre('validate', function () {
    this.total = parseFloat((this.quantity * this.unitPrice).toFixed(3));
});

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            unique: true,
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MarketingProject',
            default: null,
        },
        issueDate: { type: Date, default: Date.now },
        dueDate:   { type: Date, required: true },
        status: {
            type: String,
            enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
            default: 'Draft',
        },
        category: {
            type: String,
            enum: ['Marketing', 'Production', 'Development'],
            required: true,
        },
        lineItems:   { type: [lineItemSchema], default: [] },
        subTotal:    { type: Number, default: 0 },
        taxRate:     { type: Number, default: 19 },
        taxAmount:   { type: Number, default: 0 },
        discount:    { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        currency:    { type: String, default: 'TND' },
        notes:       { type: String, default: '' },
        paymentMethod: {
            type: String,
            enum: ['Bank Transfer', 'Cash', 'Online'],
            default: 'Bank Transfer',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        paidAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Auto-generate invoice number
invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Invoice').countDocuments();
        this.invoiceNumber = `RDX-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    // Recalculate totals
    this.subTotal = parseFloat(
        this.lineItems.reduce((sum, item) => sum + item.total, 0).toFixed(3)
    );
    const discountedSub = Math.max(0, this.subTotal - (this.discount || 0));
    this.taxAmount   = parseFloat(((discountedSub * this.taxRate) / 100).toFixed(3));
    this.totalAmount = parseFloat((discountedSub + this.taxAmount).toFixed(3));

    // Auto overdue
    if (this.status === 'Sent' && this.dueDate && new Date(this.dueDate) < new Date()) {
        this.status = 'Overdue';
    }

    next();
});

export default mongoose.model('Invoice', invoiceSchema);
