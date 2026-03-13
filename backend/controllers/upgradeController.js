import UpgradeItem from "../models/UpgradeItem.js";
import Tool from "../models/Tool.js";
import FinancialMetrics from "../models/FinancialMetrics.js";
import { logAudit } from "../utils/auditLogger.js";

// ── Wishlist Items ────────────────────────────────────────────

export const toggleFavorite = async (req, res) => {
  try {
    const item = await UpgradeItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    item.isFavorite = !item.isFavorite;
    await item.save();
    res.json({ isFavorite: item.isFavorite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUpgradeItems = async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category && category !== "All") query.category = category;
    const items = await UpgradeItem.find(query)
      .populate("purchasedToolRef", "name category")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUpgradeItem = async (req, res) => {
  try {
    const item = new UpgradeItem(req.body);
    await item.save();
    await logAudit(
      {
        action: "create",
        entityType: "UpgradeItem",
        entityId: item._id,
        details: {
          name: item.name,
          price: item.price,
          category: item.category,
        },
      },
      req,
    );
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUpgradeItem = async (req, res) => {
  try {
    const item = await UpgradeItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("purchasedToolRef", "name category");
    if (!item) return res.status(404).json({ message: "Item not found" });
    await logAudit(
      {
        action: "update",
        entityType: "UpgradeItem",
        entityId: item._id,
        details: { name: item.name },
      },
      req,
    );
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUpgradeItem = async (req, res) => {
  try {
    const item = await UpgradeItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    await logAudit(
      {
        action: "delete",
        entityType: "UpgradeItem",
        entityId: item._id,
        details: { name: item.name },
      },
      req,
    );
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Purchase an upgrade item — add it as a new Tool or as a SubTool of an existing Tool
 * Body: { purchasedAs: 'tool'|'subtool', toolId?: string, newToolCategory?: string }
 */
export const purchaseUpgradeItem = async (req, res) => {
  try {
    const { purchasedAs, toolId, newToolCategory } = req.body;
    const item = await UpgradeItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const itemCost = (item.price || 0) * (item.quantity || 1);

    if (purchasedAs === "tool") {
      // Create a new Tool from this upgrade item
      const tool = new Tool({
        name: item.name,
        basePrice: item.price,
        category: newToolCategory || item.category,
        status: "active",
      });
      await tool.save();

      item.status = "purchased";
      item.purchasedAt = new Date();
      item.purchasedAs = "tool";
      item.purchasedToolRef = tool._id;
      await item.save();

      // Deduct cost from investment fund
      const metrics = await FinancialMetrics.getInstance();
      metrics.upgradeInvestmentFund = Math.max(
        0,
        (metrics.upgradeInvestmentFund || 0) - itemCost,
      );
      if (!metrics.upgradeInvestmentHistory)
        metrics.upgradeInvestmentHistory = [];
      metrics.upgradeInvestmentHistory.push({
        amount: -itemCost,
        description: `Purchased: ${item.name}`,
        date: new Date(),
      });
      metrics.lastUpdated = new Date();
      await metrics.save();

      await logAudit(
        {
          action: "purchase",
          entityType: "UpgradeItem",
          entityId: item._id,
          details: {
            name: item.name,
            purchasedAs: "tool",
            newToolId: tool._id,
            cost: itemCost,
          },
        },
        req,
      );

      res.json({
        item: await item.populate("purchasedToolRef", "name category"),
        tool,
      });
    } else if (purchasedAs === "subtool") {
      const tool = await Tool.findById(toolId);
      if (!tool)
        return res.status(404).json({ message: "Target tool not found" });

      tool.subTools.push({
        name: item.name,
        category: newToolCategory || item.category || "General",
        purchasePrice: item.price,
        quantity: item.quantity || 1,
        status: "active",
      });
      await tool.save();

      item.status = "purchased";
      item.purchasedAt = new Date();
      item.purchasedAs = "subtool";
      item.purchasedToolRef = tool._id;
      await item.save();

      // Deduct cost from investment fund
      const metrics = await FinancialMetrics.getInstance();
      metrics.upgradeInvestmentFund = Math.max(
        0,
        (metrics.upgradeInvestmentFund || 0) - itemCost,
      );
      if (!metrics.upgradeInvestmentHistory)
        metrics.upgradeInvestmentHistory = [];
      metrics.upgradeInvestmentHistory.push({
        amount: -itemCost,
        description: `Purchased as sub-tool: ${item.name}`,
        date: new Date(),
      });
      metrics.lastUpdated = new Date();
      await metrics.save();

      await logAudit(
        {
          action: "purchase",
          entityType: "UpgradeItem",
          entityId: item._id,
          details: {
            name: item.name,
            purchasedAs: "subtool",
            toolId,
            cost: itemCost,
          },
        },
        req,
      );

      res.json({
        item: await item.populate("purchasedToolRef", "name category"),
        tool,
      });
    } else {
      res
        .status(400)
        .json({ message: 'purchasedAs must be "tool" or "subtool"' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── Investment Fund ───────────────────────────────────────────

export const getUpgradeFund = async (req, res) => {
  try {
    const [metrics, tools] = await Promise.all([
      FinancialMetrics.getInstance(),
      Tool.find().lean(),
    ]);
    const toolPayoffRevenue = tools.reduce(
      (sum, t) => sum + (t.revenueCounter || 0),
      0,
    );
    const totalToolCost = tools.reduce(
      (sum, t) => sum + (t.purchasePrice || 0),
      0,
    );
    res.json({
      investmentFund: metrics.upgradeInvestmentFund || 0,
      investmentHistory: (metrics.upgradeInvestmentHistory || [])
        .slice(-30)
        .reverse(),
      toolPayoffRevenue,
      totalToolCost,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFundDeposit = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }
    const metrics = await FinancialMetrics.getInstance();
    metrics.upgradeInvestmentFund =
      (metrics.upgradeInvestmentFund || 0) + Number(amount);
    if (!metrics.upgradeInvestmentHistory)
      metrics.upgradeInvestmentHistory = [];
    metrics.upgradeInvestmentHistory.push({
      amount: Number(amount),
      description: description || "Fund deposit",
      date: new Date(),
    });
    metrics.lastUpdated = new Date();
    await metrics.save();

    await logAudit(
      {
        action: "upgrade_fund_deposit",
        entityType: "FinancialMetrics",
        entityId: metrics._id,
        details: {
          amount: Number(amount),
          description,
          newBalance: metrics.upgradeInvestmentFund,
        },
      },
      req,
    );

    res.json({
      investmentFund: metrics.upgradeInvestmentFund,
      investmentHistory: (metrics.upgradeInvestmentHistory || [])
        .slice(-30)
        .reverse(),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const subtractFund = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }
    const metrics = await FinancialMetrics.getInstance();
    if (!metrics.upgradeInvestmentHistory)
      metrics.upgradeInvestmentHistory = [];
    metrics.upgradeInvestmentFund = Math.max(
      0,
      (metrics.upgradeInvestmentFund || 0) - Number(amount),
    );
    metrics.upgradeInvestmentHistory.push({
      amount: -Number(amount),
      description: description || "Fund withdrawal",
      date: new Date(),
    });
    metrics.lastUpdated = new Date();
    await metrics.save();

    await logAudit(
      {
        action: "upgrade_fund_withdrawal",
        entityType: "FinancialMetrics",
        entityId: metrics._id,
        details: {
          amount: Number(amount),
          description,
          newBalance: metrics.upgradeInvestmentFund,
        },
      },
      req,
    );

    res.json({
      investmentFund: metrics.upgradeInvestmentFund,
      investmentHistory: (metrics.upgradeInvestmentHistory || [])
        .slice(-30)
        .reverse(),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
