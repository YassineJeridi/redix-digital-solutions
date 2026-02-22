import Expense from '../models/Expense.js';
import Service from '../models/Service.js';
import FinancialMetrics from '../models/FinancialMetrics.js';
import { logAudit } from '../utils/auditLogger.js';

// Get all expenses
export const getExpenses = async (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;
        
        let query = {};
        
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        if (category) query.category = category;
        
        const expenses = await Expense.find(query)
            .sort({ date: -1 })
            .populate('createdBy', 'name');
        
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        res.json({
            expenses,
            totalExpenses
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create expense
export const createExpense = async (req, res) => {
    try {
        const expense = new Expense(req.body);
        await expense.save();

        await logAudit({
            action: 'create',
            entityType: 'Expense',
            entityId: expense._id,
            details: { description: expense.description, amount: expense.amount, category: expense.category }
        }, req);

        res.status(201).json(expense);
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(400).json({ message: error.message });
    }
};

// Update expense
export const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        await logAudit({
            action: 'update',
            entityType: 'Expense',
            entityId: expense._id,
            details: { description: expense.description, amount: expense.amount }
        }, req);
        
        res.json(expense);
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(400).json({ message: error.message });
    }
};

// Delete expense
export const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        await logAudit({
            action: 'delete',
            entityType: 'Expense',
            entityId: expense._id,
            details: { description: expense.description, amount: expense.amount }
        }, req);
        
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add manual deposit to Redix Caisse
export const addManualDeposit = async (req, res) => {
    try {
        const { amount, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        const metrics = await FinancialMetrics.getInstance();
        metrics.manualDeposits = (metrics.manualDeposits || 0) + parseFloat(amount);
        await metrics.save();

        await logAudit({
            action: 'create',
            entityType: 'ManualDeposit',
            entityId: metrics._id,
            details: { amount: parseFloat(amount), description: description || 'Manual deposit to Redix Caisse' }
        }, req);

        res.json({ message: 'Deposit added successfully', manualDeposits: metrics.manualDeposits });
    } catch (error) {
        console.error('Error adding manual deposit:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get financial summary (Redix Caisse - Expenses)
export const getFinancialSummary = async (req, res) => {
    try {
        // Calculate total Redix Caisse from all projects
        const projects = await Service.find({ paymentStatus: 'Done' });
        
        const totalRedixCaisse = projects.reduce((sum, project) => {
            const redixAmount = (project.totalPrice * project.revenueDistribution.redixCaisse) / 100;
            return sum + redixAmount;
        }, 0);
        
        // Calculate total expenses
        const expenses = await Expense.find();
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        // Calculate balance (must be >= 0)
        // Account for tips given and manual deposits
        const metrics = await FinancialMetrics.getInstance();
        const tipsGiven = metrics.tipsGiven || 0;
        const manualDeposits = metrics.manualDeposits || 0;
        const balance = totalRedixCaisse - totalExpenses - tipsGiven + manualDeposits;
        
        // Get monthly data for chart
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            
            // Get projects for this month
            const monthProjects = await Service.find({
                paymentStatus: 'Done',
                createdAt: { $gte: monthStart, $lte: monthEnd }
            });
            
            const monthRedix = monthProjects.reduce((sum, project) => {
                return sum + (project.totalPrice * project.revenueDistribution.redixCaisse) / 100;
            }, 0);
            
            // Get expenses for this month
            const monthExpenses = await Expense.find({
                date: { $gte: monthStart, $lte: monthEnd }
            });
            
            const monthExpenseTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            
            monthlyData.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                redixCaisse: monthRedix,
                expenses: monthExpenseTotal,
                balance: monthRedix - monthExpenseTotal
            });
        }
        
        res.json({
            totalRedixCaisse,
            totalExpenses,
            balance,
            monthlyData,
            canAddExpense: balance >= 0
        });
    } catch (error) {
        console.error('Error fetching financial summary:', error);
        res.status(500).json({ message: error.message });
    }
};

