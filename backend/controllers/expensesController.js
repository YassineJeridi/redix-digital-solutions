import Expense from "../models/Expense.js";
import Service from "../models/Service.js";
import FinancialMetrics from "../models/FinancialMetrics.js";
import { logAudit } from "../utils/auditLogger.js";

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
      .populate("createdBy", "name");

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({
      expenses,
      totalExpenses,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create expense
export const createExpense = async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();

    await logAudit(
      {
        action: "create",
        entityType: "Expense",
        entityId: expense._id,
        details: {
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
        },
      },
      req,
    );

    res.status(201).json(expense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(400).json({ message: error.message });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await logAudit(
      {
        action: "update",
        entityType: "Expense",
        entityId: expense._id,
        details: { description: expense.description, amount: expense.amount },
      },
      req,
    );

    res.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(400).json({ message: error.message });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await logAudit(
      {
        action: "delete",
        entityType: "Expense",
        entityId: expense._id,
        details: { description: expense.description, amount: expense.amount },
      },
      req,
    );

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: error.message });
  }
};

// Add manual deposit to Redix Caisse
export const addManualDeposit = async (req, res) => {
  try {
    const { amount, description, source, date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const parsedAmount = parseFloat(amount);
    const depositDate = date ? new Date(date) : new Date();
    const metrics = await FinancialMetrics.getInstance();
    metrics.manualDeposits = (metrics.manualDeposits || 0) + parsedAmount;
    metrics.totalRevenue = (metrics.totalRevenue || 0) + parsedAmount;
    if (!metrics.depositHistory) metrics.depositHistory = [];
    metrics.depositHistory.push({
      amount: parsedAmount,
      description: description || "Manual deposit to Redix Caisse",
      source: source || "",
      date: depositDate,
    });
    await metrics.save();

    await logAudit(
      {
        action: "create",
        entityType: "ManualDeposit",
        entityId: metrics._id,
        details: {
          amount: parsedAmount,
          description: description || "Manual deposit to Redix Caisse",
        },
      },
      req,
    );

    res.json({
      message: "Deposit added successfully",
      manualDeposits: metrics.manualDeposits,
    });
  } catch (error) {
    console.error("Error adding manual deposit:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper: build chart data for a given period
const buildChartData = async (
  period,
  allProjects,
  allExpenses,
  depositHistory,
) => {
  const now = new Date();
  const chartData = [];

  if (period === "day") {
    // Last 14 days, grouped by day
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i,
      );
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayProjects = allProjects.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= dayStart && d < dayEnd;
      });
      const redix = dayProjects.reduce(
        (s, p) =>
          s + (p.totalPrice * (p.revenueDistribution?.redixCaisse || 0)) / 100,
        0,
      );
      const expTotal = allExpenses
        .filter((e) => {
          const d = new Date(e.date);
          return d >= dayStart && d < dayEnd;
        })
        .reduce((s, e) => s + e.amount, 0);
      const deposits = (depositHistory || [])
        .filter((d) => {
          const dt = new Date(d.date);
          return dt >= dayStart && dt < dayEnd;
        })
        .reduce((s, d) => s + d.amount, 0);
      chartData.push({
        label: dayStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        redixCaisse: redix + deposits,
        expenses: expTotal,
      });
    }
  } else if (period === "week") {
    // Last 10 weeks, grouped by week
    for (let i = 9; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekProjects = allProjects.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= weekStart && d < weekEnd;
      });
      const redix = weekProjects.reduce(
        (s, p) =>
          s + (p.totalPrice * (p.revenueDistribution?.redixCaisse || 0)) / 100,
        0,
      );
      const expTotal = allExpenses
        .filter((e) => {
          const d = new Date(e.date);
          return d >= weekStart && d < weekEnd;
        })
        .reduce((s, e) => s + e.amount, 0);
      const deposits = (depositHistory || [])
        .filter((d) => {
          const dt = new Date(d.date);
          return dt >= weekStart && dt < weekEnd;
        })
        .reduce((s, d) => s + d.amount, 0);
      chartData.push({
        label: `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        redixCaisse: redix + deposits,
        expenses: expTotal,
      });
    }
  } else if (period === "3months") {
    // Last 3 months, grouped by month
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      const monthProjects = allProjects.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= monthStart && d <= monthEnd;
      });
      const redix = monthProjects.reduce(
        (s, p) =>
          s + (p.totalPrice * (p.revenueDistribution?.redixCaisse || 0)) / 100,
        0,
      );
      const expTotal = allExpenses
        .filter((e) => {
          const d = new Date(e.date);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((s, e) => s + e.amount, 0);
      const deposits = (depositHistory || [])
        .filter((d) => {
          const dt = new Date(d.date);
          return dt >= monthStart && dt <= monthEnd;
        })
        .reduce((s, d) => s + d.amount, 0);
      chartData.push({
        label: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        redixCaisse: redix + deposits,
        expenses: expTotal,
      });
    }
  } else if (period === "1year") {
    // Last 12 months, grouped by month
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      const monthProjects = allProjects.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= monthStart && d <= monthEnd;
      });
      const redix = monthProjects.reduce(
        (s, p) =>
          s + (p.totalPrice * (p.revenueDistribution?.redixCaisse || 0)) / 100,
        0,
      );
      const expTotal = allExpenses
        .filter((e) => {
          const d = new Date(e.date);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((s, e) => s + e.amount, 0);
      const deposits = (depositHistory || [])
        .filter((d) => {
          const dt = new Date(d.date);
          return dt >= monthStart && dt <= monthEnd;
        })
        .reduce((s, d) => s + d.amount, 0);
      chartData.push({
        label: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        redixCaisse: redix + deposits,
        expenses: expTotal,
      });
    }
  } else {
    // Default: last 6 months, grouped by month
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      const monthProjects = allProjects.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= monthStart && d <= monthEnd;
      });
      const redix = monthProjects.reduce(
        (s, p) =>
          s + (p.totalPrice * (p.revenueDistribution?.redixCaisse || 0)) / 100,
        0,
      );
      const expTotal = allExpenses
        .filter((e) => {
          const d = new Date(e.date);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((s, e) => s + e.amount, 0);
      const deposits = (depositHistory || [])
        .filter((d) => {
          const dt = new Date(d.date);
          return dt >= monthStart && dt <= monthEnd;
        })
        .reduce((s, d) => s + d.amount, 0);
      chartData.push({
        label: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        redixCaisse: redix + deposits,
        expenses: expTotal,
      });
    }
  }
  // Caisse: running balance (cumulative inflow minus cumulative expenses) — line holds when no activity
  // Expenses: stay as per-period raw amount for the bar chart
  let cumBalance = 0;
  for (const d of chartData) {
    cumBalance += d.redixCaisse - d.expenses;
    d.caisseBalance = Math.max(0, cumBalance);
    // d.expenses is intentionally left as the raw per-period amount
  }
  return chartData;
};

// Get financial summary (Redix Caisse - Expenses)
export const getFinancialSummary = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    // Calculate total Redix Caisse from all projects
    const projects = await Service.find({ paymentStatus: "Done" });
    const allExpenses = await Expense.find();

    const redixFromProjects = projects.reduce((sum, project) => {
      const redixAmount =
        (project.totalPrice * (project.revenueDistribution?.redixCaisse || 0)) /
        100;
      return sum + redixAmount;
    }, 0);

    // Calculate total expenses
    const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Account for tips given and manual deposits
    const metrics = await FinancialMetrics.getInstance();
    const tipsGiven = metrics.tipsGiven || 0;
    const manualDeposits = metrics.manualDeposits || 0;
    const depositHistory = metrics.depositHistory || [];

    // Total Redix Caisse includes manual deposits
    const totalRedixCaisse = redixFromProjects + manualDeposits;
    const balance = totalRedixCaisse - totalExpenses - tipsGiven;

    // Build chart data based on period
    const chartData = await buildChartData(
      period,
      projects,
      allExpenses,
      depositHistory,
    );

    res.json({
      totalRedixCaisse,
      totalExpenses,
      balance,
      chartData,
      depositHistory: depositHistory
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
      canAddExpense: balance >= 0,
    });
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    res.status(500).json({ message: error.message });
  }
};
