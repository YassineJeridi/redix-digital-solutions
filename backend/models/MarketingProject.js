import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true }
});

const toolUsageSchema = new mongoose.Schema({
    tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },
    usagePercentage: { type: Number, required: true, min: 0, max: 100 },
    allocatedRevenue: { type: Number, default: 0 }
});

const teamAssignmentSchema = new mongoose.Schema({
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', required: true },
    contributionPercentage: { type: Number, required: true, min: 0, max: 100 },
    allocatedRevenue: { type: Number, default: 0 }
});

const revenueDistributionSchema = new mongoose.Schema({
    toolsShare: { type: Number, default: 50 },
    teamShare: { type: Number, default: 30 },
    caisseShare: { type: Number, default: 20 },
    toolsAmount: { type: Number, default: 0 },
    teamAmount: { type: Number, default: 0 },
    caisseAmount: { type: Number, default: 0 }
});

const marketingProjectSchema = new mongoose.Schema({
    campaignName: { type: String, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    projectDate: { type: Date, default: Date.now },
    services: [serviceSchema],
    totalBudget: { type: Number, required: true },
    toolsUsage: [toolUsageSchema],
    teamAssignment: [teamAssignmentSchema],
    revenueDistribution: {
        type: revenueDistributionSchema,
        default: () => ({
            toolsShare: 50,
            teamShare: 30,
            caisseShare: 20
        })
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'cancelled'],
        default: 'pending'
    },
    revenueDistributed: { type: Boolean, default: false }
}, { timestamps: true });

marketingProjectSchema.methods.distributeRevenue = async function () {
    const totalRevenue = this.totalBudget;

    this.revenueDistribution.toolsAmount = (totalRevenue * this.revenueDistribution.toolsShare) / 100;
    this.revenueDistribution.teamAmount = (totalRevenue * this.revenueDistribution.teamShare) / 100;
    this.revenueDistribution.caisseAmount = (totalRevenue * this.revenueDistribution.caisseShare) / 100;

    for (let toolUsage of this.toolsUsage) {
        toolUsage.allocatedRevenue = (this.revenueDistribution.toolsAmount * toolUsage.usagePercentage) / 100;
    }

    for (let assignment of this.teamAssignment) {
        assignment.allocatedRevenue = (this.revenueDistribution.teamAmount * assignment.contributionPercentage) / 100;
    }

    this.revenueDistributed = true;
    return this;
};

export default mongoose.model('MarketingProject', marketingProjectSchema);
