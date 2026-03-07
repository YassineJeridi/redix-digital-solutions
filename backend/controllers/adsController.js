import AdsTransaction from "../models/AdsTransaction.js";
import AdsSettings from "../models/AdsSettings.js";
import AdsClientBudget from "../models/AdsClientBudget.js";
import { logAudit } from "../utils/auditLogger.js";

const USD_TO_TND = 3.5;

const getPeriodStart = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - parseInt(days));
  d.setHours(0, 0, 0, 0);
  return d;
};

// GET /api/ads  — all transactions (optional ?period=N&entryType=fund|spend)
export const getTransactions = async (req, res) => {
  try {
    const { period, entryType } = req.query;
    const query = {};
    if (period) query.date = { $gte: getPeriodStart(period) };
    if (entryType) query.entryType = entryType;

    const transactions = await AdsTransaction.find(query).sort({ date: -1 });
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/ads/summary?period=30
export const getSummary = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const periodStart = getPeriodStart(days);

    const [all, settings] = await Promise.all([
      AdsTransaction.find().sort({ date: 1 }),
      AdsSettings.findOne(),
    ]);

    const reservedTND = settings?.reservedTND ?? 0;

    const totalFundedUSD = all
      .filter((t) => t.entryType === "fund")
      .reduce((s, t) => s + t.amountUSD, 0);

    const totalSpentAllTimeUSD = all
      .filter((t) => t.entryType === "spend")
      .reduce((s, t) => s + t.amountUSD, 0);

    const remainingUSD = totalFundedUSD - totalSpentAllTimeUSD;

    const spentInPeriodUSD = all
      .filter((t) => t.entryType === "spend" && new Date(t.date) >= periodStart)
      .reduce((s, t) => s + t.amountUSD, 0);

    // Build chart data map for the requested period (one entry per day)
    const chartMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split("T")[0];
      chartMap[key] = { date: key, spent: 0, funded: 0 };
    }

    all
      .filter((t) => new Date(t.date) >= periodStart)
      .forEach((t) => {
        const key = new Date(t.date).toISOString().split("T")[0];
        if (chartMap[key]) {
          if (t.entryType === "spend") chartMap[key].spent += t.amountUSD;
          if (t.entryType === "fund") chartMap[key].funded += t.amountUSD;
        }
      });

    res.json({
      totalFundedUSD,
      totalFundedTND: totalFundedUSD * USD_TO_TND,
      totalSpentAllTimeUSD,
      totalSpentAllTimeTND: totalSpentAllTimeUSD * USD_TO_TND,
      remainingUSD,
      remainingTND: remainingUSD * USD_TO_TND,
      spentInPeriodUSD,
      spentInPeriodTND: spentInPeriodUSD * USD_TO_TND,
      reservedTND,
      chartData: Object.values(chartMap),
      USD_TO_TND,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/ads/settings
export const getSettings = async (req, res) => {
  try {
    let s = await AdsSettings.findOne();
    if (!s) s = await AdsSettings.create({ reservedTND: 0 });
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/ads/settings
export const updateSettings = async (req, res) => {
  try {
    const reservedTND = Math.max(0, parseFloat(req.body.reservedTND) || 0);
    const s = await AdsSettings.findOneAndUpdate(
      {},
      { reservedTND },
      { new: true, upsert: true },
    );
    res.json(s);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/ads
export const createTransaction = async (req, res) => {
  try {
    const tx = new AdsTransaction(req.body);
    await tx.save();

    // If this is a fund entry with an amountTND specified, deduct it from reservedTND
    if (tx.entryType === "fund" && tx.amountTND != null && tx.amountTND > 0) {
      const current = await AdsSettings.findOne();
      const currentReserved = current?.reservedTND ?? 0;
      const newReserved = Math.max(0, currentReserved - tx.amountTND);
      await AdsSettings.findOneAndUpdate(
        {},
        { reservedTND: newReserved },
        { upsert: true },
      );
    }

    await logAudit(
      {
        action: "create",
        entityType: "AdsTransaction",
        entityId: tx._id,
        details: {
          entryType: tx.entryType,
          spendType: tx.spendType,
          description: tx.description,
          amountUSD: tx.amountUSD,
        },
      },
      req,
    );

    res.status(201).json(tx);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/ads/:id
export const updateTransaction = async (req, res) => {
  try {
    const tx = await AdsTransaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    await logAudit(
      {
        action: "update",
        entityType: "AdsTransaction",
        entityId: tx._id,
        details: { description: tx.description, amountUSD: tx.amountUSD },
      },
      req,
    );

    res.json(tx);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/ads/:id
export const deleteTransaction = async (req, res) => {
  try {
    const tx = await AdsTransaction.findByIdAndDelete(req.params.id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    await logAudit(
      {
        action: "delete",
        entityType: "AdsTransaction",
        entityId: req.params.id,
        details: { description: tx.description, amountUSD: tx.amountUSD },
      },
      req,
    );

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/ads/client-budgets
// Returns every client that has campaign transactions, merged with their budget config.
export const getClientBudgets = async (req, res) => {
  try {
    // All campaign spend transactions
    const campaigns = await AdsTransaction.find({
      entryType: "spend",
      spendType: "campaign",
      clientName: { $exists: true, $ne: "" },
    });

    // Group by client
    const clientMap = {}; // clientName -> { campaigns: [], spent: 0 }
    for (const tx of campaigns) {
      const name = tx.clientName;
      if (!clientMap[name]) clientMap[name] = { campaigns: [], spent: 0 };
      clientMap[name].campaigns.push(tx);
    }

    // Fetch all budget documents
    const budgets = await AdsClientBudget.find();
    const budgetMap = {};
    for (const b of budgets) budgetMap[b.clientName] = b;

    // Add any budgeted clients that have no transactions yet
    for (const b of budgets) {
      if (!clientMap[b.clientName])
        clientMap[b.clientName] = { campaigns: [], spent: 0 };
    }

    const result = Object.entries(clientMap).map(([clientName, data]) => {
      const budgetDoc = budgetMap[clientName];
      const resetDate = budgetDoc?.resetDate ?? null;

      // Only count campaigns on/after resetDate
      const relevantCampaigns = resetDate
        ? data.campaigns.filter(
            (tx) => new Date(tx.date) >= new Date(resetDate),
          )
        : data.campaigns;

      const spent = relevantCampaigns.reduce(
        (s, tx) => s + (tx.amountUSD || 0),
        0,
      );

      return {
        clientName,
        totalBudget: budgetDoc?.totalBudget ?? 0,
        spent,
        campaignCount: relevantCampaigns.length,
        totalCampaignCount: data.campaigns.length,
        resetDate,
      };
    });

    // Sort alphabetically
    result.sort((a, b) => a.clientName.localeCompare(b.clientName));

    res.json({ clients: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/ads/client-budgets/:clientName — set total budget
export const upsertClientBudget = async (req, res) => {
  try {
    const { clientName } = req.params;
    const totalBudget = Math.max(0, parseFloat(req.body.totalBudget) || 0);
    const notes = req.body.notes?.trim() ?? "";

    const doc = await AdsClientBudget.findOneAndUpdate(
      { clientName },
      { totalBudget, notes },
      { new: true, upsert: true, runValidators: true },
    );
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/ads/client-budgets/:clientName — remove budget doc + all campaign transactions
export const deleteClientBudget = async (req, res) => {
  try {
    const { clientName } = req.params;
    await AdsClientBudget.deleteOne({ clientName });
    await AdsTransaction.deleteMany({
      entryType: "spend",
      spendType: "campaign",
      clientName,
    });
    res.json({ message: "Client budget deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/ads/client-budgets/:clientName/reset — reset spend tracking to now
export const resetClientBudget = async (req, res) => {
  try {
    const { clientName } = req.params;
    const doc = await AdsClientBudget.findOneAndUpdate(
      { clientName },
      { resetDate: new Date() },
      { new: true, upsert: true },
    );
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
