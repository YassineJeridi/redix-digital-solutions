import TeamMember from '../models/TeamMember.js';
import Service from '../models/Service.js';
import FinancialMetrics from '../models/FinancialMetrics.js';
import AppSettings from '../models/AppSettings.js';
import { logAudit } from '../utils/auditLogger.js';
import { createNotification } from '../utils/notificationService.js';

export const getTeamMembers = async (req, res) => {
    try {
        const members = await TeamMember.find().sort({ createdAt: -1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching team members', error: error.message });
    }
};

export const createTeamMember = async (req, res) => {
    try {
        const member = new TeamMember(req.body);
        await member.save();

        await logAudit({
            action: 'create',
            entityType: 'TeamMember',
            entityId: member._id,
            details: { name: member.name, role: member.role }
        }, req);

        res.status(201).json(member);
    } catch (error) {
        res.status(400).json({ message: 'Error creating team member', error: error.message });
    }
};

export const updateTeamMember = async (req, res) => {
    try {
        const updateData = { ...req.body };
        const hasPassword = updateData.password && updateData.password.length > 0;

        if (hasPassword) {
            // Use findById + save to trigger pre-save hook for password hashing
            const member = await TeamMember.findById(req.params.id).select('+password');
            if (!member) {
                return res.status(404).json({ message: 'Team member not found' });
            }

            Object.keys(updateData).forEach(key => {
                member[key] = updateData[key];
            });
            await member.save();

            // Return member without password
            const updatedMember = await TeamMember.findById(req.params.id);

            await logAudit({
                action: 'update',
                entityType: 'TeamMember',
                entityId: updatedMember._id,
                details: { name: updatedMember.name }
            }, req);

            return res.json(updatedMember);
        }

        // No password change — use findByIdAndUpdate
        delete updateData.password;
        const member = await TeamMember.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!member) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        await logAudit({
            action: 'update',
            entityType: 'TeamMember',
            entityId: member._id,
            details: { name: member.name }
        }, req);

        res.json(member);
    } catch (error) {
        res.status(400).json({ message: 'Error updating team member', error: error.message });
    }
};

export const deleteTeamMember = async (req, res) => {
    try {
        const member = await TeamMember.findByIdAndDelete(req.params.id);

        if (!member) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        await logAudit({
            action: 'delete',
            entityType: 'TeamMember',
            entityId: member._id,
            details: { name: member.name }
        }, req);

        res.json({ message: 'Team member deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting team member', error: error.message });
    }
};

export const addPayment = async (req, res) => {
    try {
        const { amount, description } = req.body;
        const member = await TeamMember.findById(req.params.id);

        if (!member) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        // Check Redix Caisse balance before allowing tip
        const projects = await Service.find({ paymentStatus: 'Done' }).lean();
        const totalRedixCaisse = projects.reduce((sum, project) => {
            const redixAmount = (project.totalPrice * (project.revenueDistribution?.redixCaisse || 0)) / 100;
            return sum + redixAmount;
        }, 0);
        const Expense = (await import('../models/Expense.js')).default;
        const allExpenses = await Expense.find().lean();
        const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Also account for previous tips (stored in FinancialMetrics)
        const metrics = await FinancialMetrics.getInstance();
        const tipsGiven = metrics.tipsGiven || 0;
        const manualDeposits = metrics.manualDeposits || 0;
        const caisseBalance = totalRedixCaisse - totalExpenses - tipsGiven + manualDeposits;

        if (amount > caisseBalance) {
            return res.status(400).json({ 
                message: `Insufficient Redix Caisse balance. Available: ${caisseBalance.toFixed(2)} TND` 
            });
        }

        member.addPayment(amount, description || 'Tip received');
        await member.save();

        await logAudit({
            action: 'tip',
            entityType: 'TeamMember',
            entityId: member._id,
            details: { amount, description, type: 'tip' }
        }, req);

        // Notify team member about tip received
        await createNotification(
            member._id,
            `Tip of ${amount} TND received${description ? ': ' + description : ''}`,
            'success',
            member._id
        );

        // Subtract tip from Redix Caisse via FinancialMetrics
        try {
            metrics.tipsGiven = (metrics.tipsGiven || 0) + amount;
            metrics.lastUpdated = new Date();
            await metrics.save();
        } catch (metricsErr) {
            console.error('Error updating Redix Caisse after tip:', metricsErr);
        }

        res.json(member);
    } catch (error) {
        res.status(400).json({ message: 'Error processing tip', error: error.message });
    }
};

export const addAdvance = async (req, res) => {
    try {
        const { amount, description } = req.body;
        const member = await TeamMember.findById(req.params.id);

        if (!member) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        member.addAdvance(amount, description);
        await member.save();

        res.json(member);
    } catch (error) {
        res.status(400).json({ message: 'Error adding advance', error: error.message });
    }
};

export const addWithdrawal = async (req, res) => {
    try {
        const { amount, description } = req.body;
        const member = await TeamMember.findById(req.params.id);

        if (!member) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: 'Withdrawal amount must be greater than 0' });
        }

        member.addWithdrawal(amount, description);
        await member.save();

        await logAudit({
            action: 'withdrawal',
            entityType: 'TeamMember',
            entityId: member._id,
            details: { amount, description, type: 'withdrawal' }
        }, req);

        // Notify team member about withdrawal
        await createNotification(
            member._id,
            `Withdrawal of ${amount} TND processed${description ? ': ' + description : ''}`,
            'info',
            member._id
        );

        res.json(member);
    } catch (error) {
        res.status(400).json({ message: 'Error processing withdrawal', error: error.message });
    }
};

// ── Redix Caisse management ──────────────────────────────────

export const getCaisseBalance = async (req, res) => {
    try {
        const projects = await Service.find({ paymentStatus: 'Done' }).lean();
        const totalRedixCaisse = projects.reduce((sum, project) => {
            const redixAmount = (project.totalPrice * (project.revenueDistribution?.redixCaisse || 0)) / 100;
            return sum + redixAmount;
        }, 0);
        const Expense = (await import('../models/Expense.js')).default;
        const allExpenses = await Expense.find().lean();
        const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const metrics = await FinancialMetrics.getInstance();
        const tipsGiven = metrics.tipsGiven || 0;
        const manualDeposits = metrics.manualDeposits || 0;
        const balance = totalRedixCaisse - totalExpenses - tipsGiven + manualDeposits;
        res.json({
            balance,
            tipsGiven,
            manualDeposits,
            totalRedixCaisse,
            totalExpenses,
            depositHistory: (metrics.depositHistory || []).slice(-20).reverse()
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching caisse balance', error: error.message });
    }
};

export const addCaisseDeposit = async (req, res) => {
    try {
        const { amount, description, source } = req.body;
        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }
        const metrics = await FinancialMetrics.getInstance();
        metrics.manualDeposits = (metrics.manualDeposits || 0) + Number(amount);
        metrics.depositHistory.push({
            amount: Number(amount),
            description: description || 'Manual deposit',
            source: source || 'Manual',
            date: new Date()
        });
        metrics.lastUpdated = new Date();
        await metrics.save();

        await logAudit({
            action: 'caisse_deposit',
            entityType: 'FinancialMetrics',
            entityId: metrics._id,
            details: { amount: Number(amount), description, source }
        }, req);

        const Expense = (await import('../models/Expense.js')).default;
        const allProjects = await Service.find({ paymentStatus: 'Done' }).lean();
        const totalRedixCaisse = allProjects.reduce((sum, p) => sum + (p.totalPrice * (p.revenueDistribution?.redixCaisse || 0)) / 100, 0);
        const allExpenses = await Expense.find().lean();
        const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
        const balance = totalRedixCaisse - totalExpenses - (metrics.tipsGiven || 0) + metrics.manualDeposits;
        res.json({ message: 'Deposit added successfully', balance, depositHistory: (metrics.depositHistory || []).slice(-20).reverse() });
    } catch (error) {
        res.status(400).json({ message: 'Error adding deposit', error: error.message });
    }
};

export const addCaisseDeduction = async (req, res) => {
    try {
        const { amount, description } = req.body;
        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }
        const metrics = await FinancialMetrics.getInstance();
        metrics.manualDeposits = (metrics.manualDeposits || 0) - Number(amount);
        metrics.depositHistory.push({
            amount: -Number(amount),
            description: description || 'Manual deduction',
            source: 'Manual Deduction',
            date: new Date()
        });
        metrics.lastUpdated = new Date();
        await metrics.save();

        await logAudit({
            action: 'caisse_deduction',
            entityType: 'FinancialMetrics',
            entityId: metrics._id,
            details: { amount: Number(amount), description }
        }, req);

        const Expense = (await import('../models/Expense.js')).default;
        const allProjects = await Service.find({ paymentStatus: 'Done' }).lean();
        const totalRedixCaisse = allProjects.reduce((sum, p) => sum + (p.totalPrice * (p.revenueDistribution?.redixCaisse || 0)) / 100, 0);
        const allExpenses = await Expense.find().lean();
        const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
        const balance = totalRedixCaisse - totalExpenses - (metrics.tipsGiven || 0) + metrics.manualDeposits;
        res.json({ message: 'Deduction applied successfully', balance, depositHistory: (metrics.depositHistory || []).slice(-20).reverse() });
    } catch (error) {
        res.status(400).json({ message: 'Error applying deduction', error: error.message });
    }
};

// ── Pending Earnings management ───────────────────────────────

export const adjustPendingEarnings = async (req, res) => {
    try {
        const { amount, type, description } = req.body; // type: 'add' | 'subtract' | 'set'
        if (!['add', 'subtract', 'set'].includes(type)) {
            return res.status(400).json({ message: 'type must be add, subtract, or set' });
        }
        if (amount == null || Number(amount) < 0) {
            return res.status(400).json({ message: 'Amount must be 0 or greater' });
        }
        const member = await TeamMember.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Team member not found' });
        }
        const oldValue = member.pendingEarnings;
        if (type === 'set') {
            member.pendingEarnings = Number(amount);
        } else if (type === 'add') {
            member.pendingEarnings = (member.pendingEarnings || 0) + Number(amount);
        } else {
            member.pendingEarnings = Math.max(0, (member.pendingEarnings || 0) - Number(amount));
        }
        await member.save();

        await logAudit({
            action: 'adjust_pending_earnings',
            entityType: 'TeamMember',
            entityId: member._id,
            details: { type, amount: Number(amount), description, from: oldValue, to: member.pendingEarnings }
        }, req);

        res.json(member);
    } catch (error) {
        res.status(400).json({ message: 'Error adjusting pending earnings', error: error.message });
    }
};

// ── Passkey management ────────────────────────────────────────

// POST /api/settings/verify-passkey  (public — no auth required)
export const verifyPasskey = async (req, res) => {
    try {
        const { passkey } = req.body;
        if (!passkey) return res.status(400).json({ valid: false, message: 'Passkey required' });

        const settings = await AppSettings.getInstance();
        const valid = passkey === settings.passkey;
        res.json({ valid });
    } catch (error) {
        res.status(500).json({ valid: false, message: 'Error verifying passkey' });
    }
};

// PUT /api/settings/passkey  (auth required)
export const updatePasskey = async (req, res) => {
    try {
        const { passkey, currentPasskey } = req.body;
        if (!currentPasskey) {
            return res.status(400).json({ message: 'Current passkey is required' });
        }
        if (!passkey || passkey.trim().length < 4) {
            return res.status(400).json({ message: 'New passkey must be at least 4 characters' });
        }

        const settings = await AppSettings.getInstance();
        if (currentPasskey !== settings.passkey) {
            return res.status(401).json({ message: 'Current passkey is incorrect' });
        }

        settings.passkey = passkey.trim();
        await settings.save();

        await logAudit({
            action: 'update',
            entityType: 'AppSettings',
            entityId: settings._id,
            details: { field: 'passkey' }
        }, req);

        res.json({ message: 'Passkey updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating passkey', error: error.message });
    }
};
