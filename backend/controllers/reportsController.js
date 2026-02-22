import Service from '../models/Service.js';
import Client from '../models/Client.js';
import Expense from '../models/Expense.js';
import TeamMember from '../models/TeamMember.js';
import Tool from '../models/Tool.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

// Main reports endpoint with filters
export const getReports = async (req, res) => {
    try {
        const { startDate, endDate, clientId, serviceType, paymentStatus, reportType } = req.query;

        let serviceQuery = {};
        if (startDate || endDate) {
            serviceQuery.createdAt = {};
            if (startDate) serviceQuery.createdAt.$gte = new Date(startDate);
            if (endDate) serviceQuery.createdAt.$lte = new Date(endDate + 'T23:59:59');
        }
        if (clientId) serviceQuery.client = clientId;
        if (serviceType) serviceQuery.serviceProvided = serviceType;
        if (paymentStatus) serviceQuery.paymentStatus = paymentStatus;

        const services = await Service.find(serviceQuery)
            .populate('client', 'businessName ownerName')
            .populate('teamMembers', 'name role')
            .populate('toolsUsage.tool', 'name category purchasePrice')
            .sort({ createdAt: -1 })
            .lean();

        let expenseQuery = {};
        if (startDate || endDate) {
            expenseQuery.date = {};
            if (startDate) expenseQuery.date.$gte = new Date(startDate);
            if (endDate) expenseQuery.date.$lte = new Date(endDate + 'T23:59:59');
        }
        const expenses = await Expense.find(expenseQuery).lean();

        // 1. Revenue by period (frontend expects _id, total)
        const revenueByPeriod = {};
        services.forEach(p => {
            const key = new Date(p.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!revenueByPeriod[key]) revenueByPeriod[key] = { _id: key, total: 0, count: 0 };
            revenueByPeriod[key].total += p.totalPrice || 0;
            revenueByPeriod[key].count++;
        });

        // 2. Revenue by client (frontend expects _id, total, count)
        const revenueByClient = {};
        services.forEach(p => {
            const name = p.client?.businessName || 'Unknown';
            if (!revenueByClient[name]) revenueByClient[name] = { _id: name, total: 0, count: 0 };
            revenueByClient[name].total += p.totalPrice || 0;
            revenueByClient[name].count++;
        });

        // 3. service profitability (frontend expects summary object)
        let totalToolsCost = 0, totalTeamCost = 0;
        services.forEach(p => {
            const rd = p.revenueDistribution || {};
            totalToolsCost += (p.totalPrice * (rd.toolsAndCharges || 0)) / 100;
            totalTeamCost += (p.totalPrice * (rd.teamShare || 0)) / 100;
        });
        const totalRevenue = services.reduce((s, p) => s + (p.totalPrice || 0), 0);
        const totalCosts = totalToolsCost + totalTeamCost;
        const netProfitCalc = totalRevenue - totalCosts;
        const profitability = {
            totalRevenue,
            totalCosts,
            netProfit: netProfitCalc,
            profitMargin: totalRevenue > 0 ? ((netProfitCalc / totalRevenue) * 100) : 0
        };

        // 4. Payments aging (frontend expects aging summary object)
        const now = new Date();
        let aging0_30 = 0, aging31_60 = 0, aging61_90 = 0, aging90Plus = 0;
        let totalPending = 0, totalPaid = 0;
        services.forEach(p => {
            const age = Math.floor((now - new Date(p.createdAt)) / (1000 * 60 * 60 * 24));
            if (p.paymentStatus === 'Pending') {
                totalPending += p.totalPrice || 0;
                if (age <= 30) aging0_30 += p.totalPrice || 0;
                else if (age <= 60) aging31_60 += p.totalPrice || 0;
                else if (age <= 90) aging61_90 += p.totalPrice || 0;
                else aging90Plus += p.totalPrice || 0;
            } else {
                totalPaid += p.totalPrice || 0;
            }
        });
        const payments = { aging0_30, aging31_60, aging61_90, aging90Plus, totalPending, totalPaid };

        // 5. Tools usage breakdown (frontend expects _id, percentage, totalAllocated)
        const toolsMap = {};
        let totalToolAllocated = 0;
        services.forEach(p => {
            if (p.toolsUsage) {
                const toolsChargesAmount = (p.totalPrice * (p.revenueDistribution?.toolsAndCharges || 0)) / 100;
                p.toolsUsage.forEach(tu => {
                    const toolName = tu.tool?.name || 'Unknown';
                    if (!toolsMap[toolName]) toolsMap[toolName] = { _id: toolName, category: tu.tool?.category || 'N/A', usageCount: 0, percentage: 0, totalAllocated: 0 };
                    toolsMap[toolName].usageCount++;
                    const allocated = (toolsChargesAmount * (tu.percentage || 0)) / 100;
                    toolsMap[toolName].totalAllocated += allocated;
                    totalToolAllocated += allocated;
                });
            }
        });
        Object.values(toolsMap).forEach(t => {
            t.percentage = totalToolAllocated > 0 ? ((t.totalAllocated / totalToolAllocated) * 100) : 0;
        });

        // 6. Team payouts (frontend expects memberName, projectCount, totalPayout)
        const teamPayouts = {};
        services.forEach(p => {
            if (p.teamMemberShares) {
                p.teamMemberShares.forEach(share => {
                    const id = share.memberId?.toString() || 'unknown';
                    if (!teamPayouts[id]) teamPayouts[id] = { _id: id, memberName: '', projectCount: 0, totalPayout: 0 };
                    teamPayouts[id].totalPayout += share.amount || 0;
                    teamPayouts[id].projectCount++;
                });
            }
        });
        // Enrich with names
        const members = await TeamMember.find().lean();
        const memberMap = {};
        members.forEach(m => { memberMap[m._id.toString()] = m.name; });
        Object.values(teamPayouts).forEach(tp => { tp.memberName = memberMap[tp._id] || 'Unknown'; });

        // Summary
        const totalExpenseAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const pendingRevenue = services.filter(p => p.paymentStatus === 'Pending').reduce((s, p) => s + (p.totalPrice || 0), 0);
        const paidRevenue = services.filter(p => p.paymentStatus === 'Done').reduce((s, p) => s + (p.totalPrice || 0), 0);

        res.json({
            summary: {
                totalRevenue,
                totalExpenses: totalExpenseAmount,
                netProfit: totalRevenue - totalExpenseAmount,
                totalProjects: services.length,
                avgProjectValue: services.length > 0 ? Math.round(totalRevenue / services.length) : 0,
                pendingRevenue,
                paidRevenue,
                pendingPayments: services.filter(p => p.paymentStatus === 'Pending').length,
                donePayments: services.filter(p => p.paymentStatus === 'Done').length
            },
            revenueByPeriod: Object.values(revenueByPeriod),
            revenueByClient: Object.values(revenueByClient).sort((a, b) => b.total - a.total),
            profitability,
            payments,
            toolsUsage: Object.values(toolsMap).sort((a, b) => b.totalAllocated - a.totalAllocated),
            teamPayouts: Object.values(teamPayouts).sort((a, b) => b.totalPayout - a.totalPayout),
            expenses: expenses.map(e => ({ ...e, dateStr: new Date(e.date).toLocaleDateString() }))
        });
    } catch (error) {
        console.error('Error generating reports:', error);
        res.status(500).json({ message: error.message });
    }
};

// Export CSV
export const exportReportCSV = async (req, res) => {
    try {
        const { startDate, endDate, clientId, serviceType, paymentStatus } = req.query;

        let query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
        }
        if (clientId) query.client = clientId;
        if (serviceType) query.serviceProvided = serviceType;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const services = await Service.find(query)
            .populate('client', 'businessName')
            .populate('teamMembers', 'name')
            .lean();

        const csvData = services.map(p => ({
            'service': p.projectName,
            'Client': p.client?.businessName || 'N/A',
            'Service': p.serviceProvided,
            'Price (TND)': p.totalPrice?.toFixed(2),
            'Payment': p.paymentStatus,
            'Status': p.projectStatus,
            'Start': new Date(p.startDate).toLocaleDateString(),
            'End': new Date(p.endDate).toLocaleDateString(),
            'Team': p.teamMembers?.map(m => m.name).join(', ') || 'N/A',
            'Tools %': p.revenueDistribution?.toolsAndCharges || 0,
            'Team %': p.revenueDistribution?.teamShare || 0,
            'Redix %': p.revenueDistribution?.redixCaisse || 0
        }));

        const parser = new Parser();
        const csv = parser.parse(csvData.length ? csvData : [{ 'No Data': 'No services match filters' }]);

        res.header('Content-Type', 'text/csv');
        res.attachment(`redix-report-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ message: error.message });
    }
};

// Export PDF
export const exportReportPDF = async (req, res) => {
    try {
        const { startDate, endDate, clientId, serviceType, paymentStatus } = req.query;

        let query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
        }
        if (clientId) query.client = clientId;
        if (serviceType) query.serviceProvided = serviceType;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const services = await Service.find(query)
            .populate('client', 'businessName')
            .lean();

        const doc = new PDFDocument({ margin: 50 });
        res.header('Content-Type', 'application/pdf');
        res.attachment(`redix-report-${Date.now()}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(22).fillColor('#c12de0').text('Redix Digital Solutions', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(16).fillColor('#333').text('Financial Report', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        if (startDate || endDate) {
            doc.text(`Period: ${startDate || '...'} to ${endDate || '...'}`, { align: 'center' });
        }
        doc.moveDown(1.5);

        // Summary
        const totalRevenue = services.reduce((s, p) => s + (p.totalPrice || 0), 0);
        const pending = services.filter(p => p.paymentStatus === 'Pending').length;
        const done = services.filter(p => p.paymentStatus === 'Done').length;

        doc.fontSize(12).fillColor('#c12de0').text('Summary');
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#333');
        doc.text(`Total services: ${services.length}`);
        doc.text(`Total Revenue: ${totalRevenue.toFixed(2)} TND`);
        doc.text(`Payments Done: ${done} | Pending: ${pending}`);
        doc.moveDown(1);

        // services list
        doc.fontSize(12).fillColor('#c12de0').text('services Detail');
        doc.moveDown(0.5);

        services.forEach((p, i) => {
            if (doc.y > 700) doc.addPage();
            doc.fontSize(10).fillColor('#333');
            doc.text(`${i + 1}. ${p.projectName}`, { continued: false });
            doc.fontSize(9).fillColor('#666');
            doc.text(`   Client: ${p.client?.businessName || 'N/A'} | Service: ${p.serviceProvided} | Price: ${p.totalPrice?.toFixed(2)} TND`);
            doc.text(`   Payment: ${p.paymentStatus} | Status: ${p.projectStatus}`);
            doc.moveDown(0.3);
        });

        doc.end();
    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).json({ message: error.message });
    }
};

