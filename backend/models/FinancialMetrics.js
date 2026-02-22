import mongoose from 'mongoose';

const financialMetricsSchema = new mongoose.Schema({
    // Total revenue generated from all projects
    toolsReserve: {
        type: Number,
        default: 0,
        description: 'Total money made from all projects'
    },

    // Total money distributed to team members
    teamShare: {
        type: Number,
        default: 0,
        description: 'Total amount given to team members'
    },

    // Money saved for future investments
    investmentReserve: {
        type: Number,
        default: 0,
        description: 'Total money saved for investments'
    },

    // Money reserved for daily operational charges
    redixCaisse: {
        type: Number,
        default: 0,
        description: 'Money for daily charges like transport, utilities, etc.'
    },

    // Total tips given to team members (subtracted from caisse)
    tipsGiven: {
        type: Number,
        default: 0,
        description: 'Total tips given to team members from Redix Caisse'
    },

    // Manual deposits added to Redix Caisse
    manualDeposits: {
        type: Number,
        default: 0,
        description: 'Manual money added to Redix Caisse'
    },

    // Total revenue from all sources
    totalRevenue: {
        type: Number,
        default: 0
    },

    // Total expenses
    totalExpenses: {
        type: Number,
        default: 0
    },

    // Net profit (revenue - expenses)
    netProfit: {
        type: Number,
        default: 0
    },

    // Last updated timestamp
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Method to update metrics
financialMetricsSchema.methods.updateMetrics = function (updates) {
    Object.keys(updates).forEach(key => {
        if (this[key] !== undefined) {
            this[key] += updates[key];
        }
    });

    this.netProfit = this.totalRevenue - this.totalExpenses;
    this.lastUpdated = new Date();
    return this;
};

// Static method to get or create singleton instance
financialMetricsSchema.statics.getInstance = async function () {
    let metrics = await this.findOne();
    if (!metrics) {
        metrics = await this.create({});
    }
    return metrics;
};

export default mongoose.model('FinancialMetrics', financialMetricsSchema);
