import Charge from '../models/Charge.js';
import FinancialMetrics from '../models/FinancialMetrics.js';

export const getCharges = async (req, res) => {
    try {
        const charges = await Charge.find().sort({ createdAt: -1 });
        res.json(charges);
    } catch (error) {
        console.error('Error fetching charges:', error);
        res.status(500).json({
            message: 'Error fetching charges',
            error: error.message
        });
    }
};

export const createCharge = async (req, res) => {
    try {
        const charge = new Charge(req.body);
        await charge.save();

        // Deduct from Redix Caisse
        const metrics = await FinancialMetrics.getInstance();
        metrics.redixCaisse -= charge.amount;
        metrics.totalExpenses += charge.amount;
        metrics.netProfit = metrics.totalRevenue - metrics.totalExpenses;
        metrics.lastUpdated = new Date();
        await metrics.save();

        res.status(201).json({ charge, metrics });
    } catch (error) {
        console.error('Error creating charge:', error);
        res.status(400).json({
            message: 'Error creating charge',
            error: error.message
        });
    }
};

export const updateCharge = async (req, res) => {
    try {
        const oldCharge = await Charge.findById(req.params.id);
        if (!oldCharge) {
            return res.status(404).json({ message: 'Charge not found' });
        }

        const metrics = await FinancialMetrics.getInstance();

        // Reverse old charge
        metrics.redixCaisse += oldCharge.amount;
        metrics.totalExpenses -= oldCharge.amount;

        // Apply new charge
        const updatedCharge = await Charge.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        metrics.redixCaisse -= updatedCharge.amount;
        metrics.totalExpenses += updatedCharge.amount;
        metrics.netProfit = metrics.totalRevenue - metrics.totalExpenses;
        metrics.lastUpdated = new Date();
        await metrics.save();

        res.json({ charge: updatedCharge, metrics });
    } catch (error) {
        console.error('Error updating charge:', error);
        res.status(400).json({
            message: 'Error updating charge',
            error: error.message
        });
    }
};

export const deleteCharge = async (req, res) => {
    try {
        const charge = await Charge.findById(req.params.id);
        if (!charge) {
            return res.status(404).json({ message: 'Charge not found' });
        }

        // Return amount to Redix Caisse
        const metrics = await FinancialMetrics.getInstance();
        metrics.redixCaisse += charge.amount;
        metrics.totalExpenses -= charge.amount;
        metrics.netProfit = metrics.totalRevenue - metrics.totalExpenses;
        metrics.lastUpdated = new Date();
        await metrics.save();

        await Charge.findByIdAndDelete(req.params.id);

        res.json({ message: 'Charge deleted successfully', metrics });
    } catch (error) {
        console.error('Error deleting charge:', error);
        res.status(500).json({
            message: 'Error deleting charge',
            error: error.message
        });
    }
};
