import Service from "../models/Service.js";
import Expense from "../models/Expense.js";
import Tool from "../models/Tool.js";
import FinancialMetrics from "../models/FinancialMetrics.js";
import AdsTransaction from "../models/AdsTransaction.js";
import AdsSettings from "../models/AdsSettings.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Period filter (week | month | year | all)
    const { period = "all" } = req.query;
    let periodStart = null;
    if (period === "week") {
      periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 7);
      periodStart.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      periodStart = new Date();
      periodStart.setMonth(periodStart.getMonth() - 1);
      periodStart.setHours(0, 0, 0, 0);
    } else if (period === "year") {
      periodStart = new Date();
      periodStart.setFullYear(periodStart.getFullYear() - 1);
      periodStart.setHours(0, 0, 0, 0);
    }

    // Real data from Services
    const allServices = await Service.find()
      .populate("client", "businessName ownerName")
      .populate("teamMembers", "name")
      .lean();
    const allExpenses = await Expense.find().lean();

    // Period-filtered collections (for Revenue, Expenses, Net Profit, stats)
    const periodServices = periodStart
      ? allServices.filter((s) => new Date(s.createdAt) >= periodStart)
      : allServices;
    const periodExpenses = periodStart
      ? allExpenses.filter((e) => new Date(e.date) >= periodStart)
      : allExpenses;

    const paidServices = periodServices.filter(
      (p) => p.paymentStatus === "Done",
    );
    const serviceRevenue = paidServices.reduce(
      (s, p) => s + (p.totalPrice || 0),
      0,
    );

    // Include manual deposits in total revenue (all-time aggregate)
    const metricsDoc = await FinancialMetrics.getInstance();
    const manualDeposits = metricsDoc.manualDeposits || 0;
    const totalRevenue =
      serviceRevenue + (period === "all" ? manualDeposits : 0);

    const totalExpenses = periodExpenses.reduce(
      (s, e) => s + (e.amount || 0),
      0,
    );
    const netProfit = totalRevenue - totalExpenses;

    // Redix Caisse is always all-time (running balance)
    const allPaidServices = allServices.filter(
      (p) => p.paymentStatus === "Done",
    );
    let toolsReserve = 0,
      teamShare = 0,
      redixCaisse = 0;
    allPaidServices.forEach((p) => {
      const rd = p.revenueDistribution || {};
      toolsReserve += (p.totalPrice * (rd.toolsAndCharges || 0)) / 100;
      teamShare += (p.totalPrice * (rd.teamShare || 0)) / 100;
      redixCaisse += (p.totalPrice * (rd.redixCaisse || 0)) / 100;
    });
    redixCaisse += manualDeposits;
    const allTimeExpenses = allExpenses.reduce(
      (s, e) => s + (e.amount || 0),
      0,
    );
    redixCaisse -= allTimeExpenses;

    // Revenue by department (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const revenueByMonth = {};
    allServices.forEach((project) => {
      const d = new Date(project.createdAt);
      if (d >= twelveMonthsAgo) {
        const key = d.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        if (!revenueByMonth[key])
          revenueByMonth[key] = { Marketing: 0, Production: 0, Development: 0 };
        revenueByMonth[key][project.serviceProvided || "Marketing"] +=
          project.totalPrice || 0;
      }
    });

    const chartData = Object.keys(revenueByMonth).map((month) => ({
      month,
      ...revenueByMonth[month],
    }));

    const recentProjects = periodServices
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    // Department totals for donut chart (period-filtered)
    const departmentTotals = [
      {
        name: "Marketing",
        value: periodServices
          .filter((p) => p.serviceProvided === "Marketing")
          .reduce((s, p) => s + (p.totalPrice || 0), 0),
      },
      {
        name: "Production",
        value: periodServices
          .filter((p) => p.serviceProvided === "Production")
          .reduce((s, p) => s + (p.totalPrice || 0), 0),
      },
      {
        name: "Development",
        value: periodServices
          .filter((p) => p.serviceProvided === "Development")
          .reduce((s, p) => s + (p.totalPrice || 0), 0),
      },
    ];

    // Weekly evolution (last 8 weeks)
    const weeklyEvolution = [];
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekProjects = allServices.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= weekStart && d < weekEnd;
      });
      weeklyEvolution.push({
        week: `Week ${8 - i}`,
        Marketing: weekProjects
          .filter((p) => p.serviceProvided === "Marketing")
          .reduce((s, p) => s + (p.totalPrice || 0), 0),
        Production: weekProjects
          .filter((p) => p.serviceProvided === "Production")
          .reduce((s, p) => s + (p.totalPrice || 0), 0),
        Development: weekProjects
          .filter((p) => p.serviceProvided === "Development")
          .reduce((s, p) => s + (p.totalPrice || 0), 0),
        total: weekProjects.reduce((s, p) => s + (p.totalPrice || 0), 0),
      });
    }

    // Tools reserved total from Tool model (all-time)
    const allTools = await Tool.find().lean();
    const toolsReservedTotal = allTools.reduce(
      (s, t) => s + (t.revenueCounter || 0),
      0,
    );

    // Ads data (all-time running balances)
    const [allAdsTx, adsSettings] = await Promise.all([
      AdsTransaction.find().lean(),
      AdsSettings.findOne().lean(),
    ]);
    const USD_TO_TND = 3.5;
    const totalFundedUSD = allAdsTx
      .filter((t) => t.entryType === "fund")
      .reduce((s, t) => s + t.amountUSD, 0);
    const totalSpentUSD = allAdsTx
      .filter((t) => t.entryType === "spend")
      .reduce((s, t) => s + t.amountUSD, 0);
    const adsRemainingBalance = (totalFundedUSD - totalSpentUSD) * USD_TO_TND;
    const adsReservedTND = adsSettings?.reservedTND ?? 0;

    res.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      toolsReserve,
      teamShare,
      redixCaisse,
      adsRemainingBalance,
      adsReservedTND,
      toolsRevenue: toolsReservedTotal,
      totalServices: periodServices.length,
      activeServices: periodServices.filter(
        (p) => p.projectStatus === "In Progress",
      ).length,
      completedServices: periodServices.filter(
        (p) => p.projectStatus === "Completed",
      ).length,
      pendingPayments: periodServices.filter(
        (p) => p.paymentStatus === "Pending",
      ).length,
      donePayments: periodServices.filter((p) => p.paymentStatus === "Done")
        .length,
      revenueByDepartment: chartData,
      departmentTotals,
      weeklyEvolution,
      toolsReservedTotal,
      recentServices: recentProjects,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};
