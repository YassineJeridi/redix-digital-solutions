import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['earning', 'advance', 'payment', 'deduction', 'withdrawal', 'commission', 'tip'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const teamMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        minlength: 6,
        select: false
    },
    profileImage: {
        type: String,
        default: ''
    },

    // Financial tracking
    totalReceived: {
        type: Number,
        default: 0,
        description: 'Total money received from paid (Done) projects'
    },

    totalWithdrawn: {
        type: Number,
        default: 0,
        description: 'Total money withdrawn/paid out to team member'
    },

    pendingEarnings: {
        type: Number,
        default: 0,
        description: 'Earnings from projects still pending payment'
    },

    totalEarned: {
        type: Number,
        default: 0
    },

    balance: {
        type: Number,
        default: 0
    },

    transactions: [transactionSchema],

    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual: Current Balance = Total Received - Total Withdrawn
teamMemberSchema.virtual('currentBalance').get(function () {
    return (this.totalReceived || 0) - (this.totalWithdrawn || 0);
});

// Add earning when project payment is Done
teamMemberSchema.methods.addEarning = function (amount, projectId, description) {
    this.totalReceived += amount;
    this.totalEarned += amount;
    this.balance = this.totalReceived - this.totalWithdrawn;

    this.transactions.push({
        type: 'earning',
        amount,
        description: description || 'Project earning',
        project: projectId,
        date: new Date()
    });

    return this;
};

// Tip (money received by team member from Redix Caisse)
teamMemberSchema.methods.addPayment = function (amount, description) {
    this.totalReceived += amount;
    this.totalEarned += amount;
    this.balance = this.totalReceived - this.totalWithdrawn;

    this.transactions.push({
        type: 'tip',
        amount,
        description: description || 'Tip received',
        date: new Date()
    });

    return this;
};

teamMemberSchema.methods.addAdvance = function (amount, description) {
    this.totalWithdrawn += amount;
    this.balance = this.totalReceived - this.totalWithdrawn;

    this.transactions.push({
        type: 'advance',
        amount,
        description: description || 'Advance payment',
        date: new Date()
    });

    return this;
};

teamMemberSchema.methods.reverseEarning = function (amount, projectId) {
    this.totalReceived = Math.max(0, this.totalReceived - amount);
    this.totalEarned = Math.max(0, this.totalEarned - amount);
    this.balance = this.totalReceived - this.totalWithdrawn;

    this.transactions.push({
        type: 'deduction',
        amount,
        description: 'Project deleted - earning reversed',
        project: projectId,
        date: new Date()
    });

    return this;
};

teamMemberSchema.methods.addWithdrawal = function (amount, description) {
    this.totalWithdrawn += amount;
    this.balance = this.totalReceived - this.totalWithdrawn;

    this.transactions.push({
        type: 'withdrawal',
        amount,
        description: description || 'Withdrawal',
        date: new Date()
    });

    return this;
};

// Add pending earnings (project not yet paid)
teamMemberSchema.methods.addPendingEarning = function (amount, projectId, description) {
    this.pendingEarnings += amount;

    return this;
};

// Convert pending to received when project is paid
teamMemberSchema.methods.confirmPendingEarning = function (amount, projectId, description) {
    this.pendingEarnings = Math.max(0, this.pendingEarnings - amount);
    this.totalReceived += amount;
    this.totalEarned += amount;
    this.balance = this.totalReceived - this.totalWithdrawn;

    this.transactions.push({
        type: 'earning',
        amount,
        description: description || 'Payment confirmed - earning received',
        project: projectId,
        date: new Date()
    });

    return this;
};

// Hash password before saving
teamMemberSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
teamMemberSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('TeamMember', teamMemberSchema);
