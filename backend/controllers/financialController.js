import FinancialMetrics from '../models/FinancialMetrics.js';

export const getFinancialMetrics = async (req, res) => {
    try {
        const metrics = await FinancialMetrics.getInstance();
        res.json(metrics);
    } catch (error) {
        console.error('Error fetching financial metrics:', error);
        res.status(500).json({
            message: 'Error fetching financial metrics',
            error: error.message
        });
    }
};

export const updateInvestmentReserve = async (req, res) => {
    try {
        const { amount, operation } = req.body; // operation: 'add' or 'subtract'
        const metrics = await FinancialMetrics.getInstance();

        if (operation === 'add') {
            metrics.investmentReserve += amount;
            metrics.redixCaisse -= amount; // Transfer from caisse
        } else if (operation === 'subtract') {
            metrics.investmentReserve -= amount;
            metrics.redixCaisse += amount; // Return to caisse
        }

        metrics.lastUpdated = new Date();
        await metrics.save();

        res.json(metrics);
    } catch (error) {
        console.error('Error updating investment reserve:', error);
        res.status(400).json({
            message: 'Error updating investment reserve',
            error: error.message
        });
    }
};

export const updateRedixCaisse = async (req, res) => {
    try {
        const { amount, description } = req.body;
        const metrics = await FinancialMetrics.getInstance();

        metrics.redixCaisse += amount;
        metrics.totalExpenses += Math.abs(amount);
        metrics.lastUpdated = new Date();
        await metrics.save();

        res.json(metrics);
    } catch (error) {
        console.error('Error updating Redix Caisse:', error);
        res.status(400).json({
            message: 'Error updating Redix Caisse',
            error: error.message
        });
    }
};
