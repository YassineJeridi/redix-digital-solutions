import mongoose from 'mongoose';

const toolUsageSchema = new mongoose.Schema({
    tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 }
});

const teamMemberShareSchema = new mongoose.Schema({
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    amount: { type: Number, required: true, min: 0 }
});

const attachmentSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    uploadedAt: { type: Date, default: Date.now }
});

const noteSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', required: true },
    createdAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
    // Basic fields
    projectName: { type: String, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Partial', 'Done'], required: true, default: 'Pending' },
    projectStatus: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], required: true, default: 'Not Started' },
    totalPrice: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    serviceProvided: { type: String, enum: ['Marketing', 'Production', 'Development'], required: true },

    // Revenue Distribution (must total 100%)
    revenueDistribution: {
        toolsAndCharges: { type: Number, required: true, min: 0, max: 100 },
        teamShare: { type: Number, required: true, min: 0, max: 100 },
        redixCaisse: { type: Number, required: true, min: 0, max: 100 }
    },

    // Service-specific fields - Marketing
    marketing: {
        videosCount: { type: Number, default: 0, min: 0 },
        postsCount: { type: Number, default: 0, min: 0 },
        shootingSessionsCount: { type: Number, default: 0, min: 0 }
    },

    // Service-specific fields - Production
    production: {
        videosCount: { type: Number, default: 0, min: 0 },
        picturesCount: { type: Number, default: 0, min: 0 },
        shootingSessionsCount: { type: Number, default: 0, min: 0 }
    },

    // Service-specific fields - Development
    development: {
        description: { type: String },
        platform: { type: String, enum: ['Web', 'Mobile'] },
        typeComplexity: { type: String, enum: ['Vitrine', 'Advanced'] }
    },

    // Tools Usage (only for Marketing/Production, must total 100%)
    toolsUsage: [toolUsageSchema],

    // Team Assignment (must total 100%)
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' }],
    teamMemberShares: [teamMemberShareSchema],

    // Attachments & Notes
    attachments: [attachmentSchema],
    notes: [noteSchema],

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' }
}, { timestamps: true });

// Validation: End date must be after start date
projectSchema.pre('save', function (next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    }
    
    // Validate revenue distribution totals 100%
    const revTotal = this.revenueDistribution.toolsAndCharges + 
                     this.revenueDistribution.teamShare + 
                     this.revenueDistribution.redixCaisse;
    if (Math.abs(revTotal - 100) > 0.01) {
        next(new Error('Revenue distribution must total exactly 100%'));
    }

    // Validate tools usage totals 100% (if tools are used)
    if (this.toolsUsage && this.toolsUsage.length > 0) {
        const toolsTotal = this.toolsUsage.reduce((sum, tool) => sum + tool.percentage, 0);
        if (Math.abs(toolsTotal - 100) > 0.01) {
            next(new Error('Tools usage percentages must total exactly 100%'));
        }
    }

    // Validate team member shares total 100% (if shares are defined)
    if (this.teamMemberShares && this.teamMemberShares.length > 0) {
        const sharesTotal = this.teamMemberShares.reduce((sum, share) => sum + share.percentage, 0);
        if (Math.abs(sharesTotal - 100) > 0.01) {
            next(new Error('Team member shares must total exactly 100%'));
        }
    }

    next();
});

// No longer need budget variance virtual
// projectSchema.virtual('budgetVariance').get(function () {
//     return this.actualSpend - this.plannedBudget;
// });

export default mongoose.model('Project', projectSchema);
