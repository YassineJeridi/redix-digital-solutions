import Service from '../models/Service.js';
import Expense from '../models/Expense.js';
import Tool from '../models/Tool.js';
import FinancialMetrics from '../models/FinancialMetrics.js';

export const getDashboardStats = async (req, res) => {
    try {
        // Real data from Services
        const allServices = await Service.find()
            .populate('client', 'businessName ownerName')
            .populate('teamMembers', 'name')
            .lean();
        const allExpenses = await Expense.find().lean();

        const paidServices = allServices.filter(p => p.paymentStatus === 'Done');
        const serviceRevenue = paidServices.reduce((s, p) => s + (p.totalPrice || 0), 0);

        // Include manual deposits in total revenue
        const metricsDoc = await FinancialMetrics.getInstance();
        const manualDeposits = metricsDoc.manualDeposits || 0;
        const totalRevenue = serviceRevenue + manualDeposits;

        let toolsReserve = 0, teamShare = 0, redixCaisse = 0;
        paidServices.forEach(p => {
            const rd = p.revenueDistribution || {};
            toolsReserve += (p.totalPrice * (rd.toolsAndCharges || 0)) / 100;
            teamShare += (p.totalPrice * (rd.teamShare || 0)) / 100;
            redixCaisse += (p.totalPrice * (rd.redixCaisse || 0)) / 100;
        });

        // Include manual deposits in Redix Caisse
        redixCaisse += manualDeposits;

        const totalExpenses = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;

        // Revenue by department (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);

        const revenueByMonth = {};
        allServices.forEach(project => {
            const d = new Date(project.createdAt);
            if (d >= twelveMonthsAgo) {
                const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
                if (!revenueByMonth[key]) revenueByMonth[key] = { Marketing: 0, Production: 0, Development: 0 };
                revenueByMonth[key][project.serviceProvided || 'Marketing'] += project.totalPrice || 0;
            }
        });

        const chartData = Object.keys(revenueByMonth).map(month => ({
            month, ...revenueByMonth[month]
        }));

        const recentProjects = allServices
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        // Department totals for donut chart
        const departmentTotals = [
            { name: 'Marketing', value: allServices.filter(p => p.serviceProvided === 'Marketing').reduce((s, p) => s + (p.totalPrice || 0), 0) },
            { name: 'Production', value: allServices.filter(p => p.serviceProvided === 'Production').reduce((s, p) => s + (p.totalPrice || 0), 0) },
            { name: 'Development', value: allServices.filter(p => p.serviceProvided === 'Development').reduce((s, p) => s + (p.totalPrice || 0), 0) }
        ];

        // Weekly evolution (last 8 weeks)
        const weeklyEvolution = [];
        for (let i = 7; i >= 0; i--) {
            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() - i * 7);
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 7);
            const weekProjects = allServices.filter(p => {
                const d = new Date(p.createdAt);
                return d >= weekStart && d < weekEnd;
            });
            weeklyEvolution.push({
                week: `Week ${8 - i}`,
                Marketing: weekProjects.filter(p => p.serviceProvided === 'Marketing').reduce((s, p) => s + (p.totalPrice || 0), 0),
                Production: weekProjects.filter(p => p.serviceProvided === 'Production').reduce((s, p) => s + (p.totalPrice || 0), 0),
                Development: weekProjects.filter(p => p.serviceProvided === 'Development').reduce((s, p) => s + (p.totalPrice || 0), 0),
                total: weekProjects.reduce((s, p) => s + (p.totalPrice || 0), 0)
            });
        }

        // Tools reserved total from Tool model
        const allTools = await Tool.find().lean();
        const toolsReservedTotal = allTools.reduce((s, t) => s + (t.revenueCounter || 0), 0);

        res.json({
            totalRevenue, totalExpenses, netProfit, toolsReserve, teamShare, redixCaisse,
            totalServices: allServices.length,
            activeServices: allServices.filter(p => p.projectStatus === 'In Progress').length,
            completedServices: allServices.filter(p => p.projectStatus === 'Completed').length,
            pendingPayments: allServices.filter(p => p.paymentStatus === 'Pending').length,
            donePayments: allServices.filter(p => p.paymentStatus === 'Done').length,
            revenueByDepartment: chartData,
            departmentTotals,
            weeklyEvolution,
            toolsReservedTotal,
            recentServices: recentProjects
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
    }
};

