import MarketingProject from '../models/MarketingProject.js';
import Tool from '../models/Tool.js';
import TeamMember from '../models/TeamMember.js';
import FinancialMetrics from '../models/FinancialMetrics.js';
import mongoose from 'mongoose';

export const getMarketingProjects = async (req, res) => {
    try {
        const projects = await MarketingProject.find()
            .populate('client', 'businessName ownerName')
            .populate('toolsUsage.tool', 'name category')
            .populate('teamAssignment.member', 'name role')
            .sort({ createdAt: -1 });

        res.json(projects);
    } catch (error) {
        console.error('Error fetching marketing projects:', error);
        res.status(500).json({
            message: 'Error fetching marketing projects',
            error: error.message
        });
    }
};

export const getMarketingProjectById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid project ID' });
        }

        const project = await MarketingProject.findById(req.params.id)
            .populate('client', 'businessName ownerName')
            .populate('toolsUsage.tool', 'name category purchasePrice revenueCounter')
            .populate('teamAssignment.member', 'name role');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            message: 'Error fetching project',
            error: error.message
        });
    }
};

export const createMarketingProject = async (req, res) => {
    try {
        const project = new MarketingProject(req.body);

        // Calculate revenue distribution
        await project.distributeRevenue();
        await project.save();

        // Get financial metrics instance
        const metrics = await FinancialMetrics.getInstance();

        // Update tools reserve and statistics
        for (let toolUsage of project.toolsUsage) {
            if (toolUsage.tool && mongoose.Types.ObjectId.isValid(toolUsage.tool)) {
                try {
                    await Tool.findByIdAndUpdate(
                        toolUsage.tool,
                        {
                            $inc: {
                                revenueCounter: toolUsage.allocatedRevenue || 0,
                                usageCount: 1
                            },
                            lastUsed: new Date()
                        }
                    );

                    const tool = await Tool.findById(toolUsage.tool);
                    if (tool) {
                        tool.calculatePayoff();
                        await tool.save();
                    }
                } catch (toolError) {
                    console.error('Error updating tool:', toolError);
                }
            }
        }

        // Update team members earnings
        for (let assignment of project.teamAssignment) {
            if (assignment.member && mongoose.Types.ObjectId.isValid(assignment.member)) {
                try {
                    const teamMember = await TeamMember.findById(assignment.member);
                    if (teamMember) {
                        teamMember.addEarning(
                            assignment.allocatedRevenue || 0,
                            project._id,
                            `${project.campaignName} - ${assignment.contributionPercentage}% contribution`
                        );
                        await teamMember.save();
                    }
                } catch (memberError) {
                    console.error('Error updating team member:', memberError);
                }
            }
        }

        // Update financial metrics
        metrics.updateMetrics({
            toolsReserve: project.revenueDistribution.toolsAmount,
            teamShare: project.revenueDistribution.teamAmount,
            redixCaisse: project.revenueDistribution.caisseAmount,
            totalRevenue: project.totalBudget
        });
        await metrics.save();

        await project.populate('client', 'businessName ownerName');
        await project.populate('toolsUsage.tool', 'name category');
        await project.populate('teamAssignment.member', 'name role');

        res.status(201).json(project);
    } catch (error) {
        console.error('Error creating marketing project:', error);
        res.status(400).json({
            message: 'Error creating marketing project',
            error: error.message
        });
    }
};

export const updateMarketingProject = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid project ID' });
        }

        const oldProject = await MarketingProject.findById(req.params.id);

        if (!oldProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const metrics = await FinancialMetrics.getInstance();

        // Reverse old distributions
        if (oldProject.revenueDistributed) {
            // Reverse tools
            for (let toolUsage of oldProject.toolsUsage) {
                if (toolUsage.tool && mongoose.Types.ObjectId.isValid(toolUsage.tool)) {
                    try {
                        const tool = await Tool.findById(toolUsage.tool);
                        if (tool) {
                            tool.revenueCounter = Math.max(0, tool.revenueCounter - (toolUsage.allocatedRevenue || 0));
                            tool.usageCount = Math.max(0, tool.usageCount - 1);
                            tool.calculatePayoff();
                            await tool.save();
                        }
                    } catch (toolError) {
                        console.error('Error reversing tool update:', toolError);
                    }
                }
            }

            // Reverse team earnings
            for (let assignment of oldProject.teamAssignment) {
                if (assignment.member && mongoose.Types.ObjectId.isValid(assignment.member)) {
                    try {
                        const teamMember = await TeamMember.findById(assignment.member);
                        if (teamMember) {
                            teamMember.reverseEarning(assignment.allocatedRevenue || 0, oldProject._id);
                            await teamMember.save();
                        }
                    } catch (memberError) {
                        console.error('Error reversing team member earning:', memberError);
                    }
                }
            }

            // Reverse metrics
            metrics.updateMetrics({
                toolsReserve: -(oldProject.revenueDistribution.toolsAmount || 0),
                teamShare: -(oldProject.revenueDistribution.teamAmount || 0),
                redixCaisse: -(oldProject.revenueDistribution.caisseAmount || 0),
                totalRevenue: -(oldProject.totalBudget || 0)
            });
        }

        // Update project with new data
        Object.assign(oldProject, req.body);
        await oldProject.distributeRevenue();
        await oldProject.save();

        // Apply new distributions
        for (let toolUsage of oldProject.toolsUsage) {
            if (toolUsage.tool && mongoose.Types.ObjectId.isValid(toolUsage.tool)) {
                try {
                    await Tool.findByIdAndUpdate(
                        toolUsage.tool,
                        {
                            $inc: {
                                revenueCounter: toolUsage.allocatedRevenue || 0,
                                usageCount: 1
                            },
                            lastUsed: new Date()
                        }
                    );

                    const tool = await Tool.findById(toolUsage.tool);
                    if (tool) {
                        tool.calculatePayoff();
                        await tool.save();
                    }
                } catch (toolError) {
                    console.error('Error updating tool:', toolError);
                }
            }
        }

        for (let assignment of oldProject.teamAssignment) {
            if (assignment.member && mongoose.Types.ObjectId.isValid(assignment.member)) {
                try {
                    const teamMember = await TeamMember.findById(assignment.member);
                    if (teamMember) {
                        teamMember.addEarning(
                            assignment.allocatedRevenue || 0,
                            oldProject._id,
                            `${oldProject.campaignName} - Updated`
                        );
                        await teamMember.save();
                    }
                } catch (memberError) {
                    console.error('Error updating team member:', memberError);
                }
            }
        }

        metrics.updateMetrics({
            toolsReserve: oldProject.revenueDistribution.toolsAmount,
            teamShare: oldProject.revenueDistribution.teamAmount,
            redixCaisse: oldProject.revenueDistribution.caisseAmount,
            totalRevenue: oldProject.totalBudget
        });
        await metrics.save();

        await oldProject.populate('client', 'businessName ownerName');
        await oldProject.populate('toolsUsage.tool', 'name category');
        await oldProject.populate('teamAssignment.member', 'name role');

        res.json(oldProject);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(400).json({
            message: 'Error updating project',
            error: error.message
        });
    }
};

export const deleteMarketingProject = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid project ID' });
        }

        const project = await MarketingProject.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const metrics = await FinancialMetrics.getInstance();

        // Reverse all distributions
        if (project.revenueDistributed) {
            // Reverse tools
            for (let toolUsage of project.toolsUsage) {
                if (toolUsage.tool && mongoose.Types.ObjectId.isValid(toolUsage.tool)) {
                    try {
                        const tool = await Tool.findById(toolUsage.tool);
                        if (tool) {
                            tool.revenueCounter = Math.max(0, tool.revenueCounter - (toolUsage.allocatedRevenue || 0));
                            tool.usageCount = Math.max(0, tool.usageCount - 1);
                            tool.calculatePayoff();
                            await tool.save();
                        }
                    } catch (toolError) {
                        console.error('Error reversing tool revenue:', toolError);
                    }
                }
            }

            // Reverse team earnings
            for (let assignment of project.teamAssignment) {
                if (assignment.member && mongoose.Types.ObjectId.isValid(assignment.member)) {
                    try {
                        const teamMember = await TeamMember.findById(assignment.member);
                        if (teamMember) {
                            teamMember.reverseEarning(assignment.allocatedRevenue || 0, project._id);
                            await teamMember.save();
                        }
                    } catch (memberError) {
                        console.error('Error reversing team member earning:', memberError);
                    }
                }
            }

            // Reverse metrics
            metrics.updateMetrics({
                toolsReserve: -(project.revenueDistribution.toolsAmount || 0),
                teamShare: -(project.revenueDistribution.teamAmount || 0),
                redixCaisse: -(project.revenueDistribution.caisseAmount || 0),
                totalRevenue: -(project.totalBudget || 0)
            });
            await metrics.save();
        }

        await MarketingProject.findByIdAndDelete(req.params.id);

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            message: 'Error deleting project',
            error: error.message
        });
    }
};
