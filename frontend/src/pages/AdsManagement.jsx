import React, { useState, useEffect, useCallback } from "react";
import {
  MdCampaign,
  MdAdd,
  MdAddCircle,
  MdDelete,
  MdEdit,
  MdAttachMoney,
  MdTrendingDown,
  MdClose,
  MdFilterList,
  MdHistory,
  MdAccountBalanceWallet,
  MdEditNote,
  MdPeople,
  MdRefresh,
  MdCheck,
} from "react-icons/md";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import * as AdsService from "../services/AdsServices";
import { getClients } from "../services/ClientsServices";
import styles from "./AdsManagement.module.css";

const USD_TO_TND = 3.5;

const PERIODS = [
  { label: "7D", value: 7 },
  { label: "14D", value: 14 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
  { label: "1Y", value: 365 },
];

const today = () => new Date().toISOString().split("T")[0];

const fmtUSD = (n) =>
  `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtTND = (n) =>
  `${((n || 0) * USD_TO_TND).toLocaleString("fr-TN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`;

const fmtTNDRaw = (n) =>
  `${(n || 0).toLocaleString("fr-TN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const typeLabel = (tx) => {
  if (tx.entryType === "fund") return "Fund Added";
  const map = {
    campaign: "Campaign",
    subscription: "Subscription",
    purchase: "Purchase",
    other: "Other",
  };
  return map[tx.spendType] || "Spend";
};

const typeBadgeClass = (tx, s) => {
  if (tx.entryType === "fund") return s.badgeFund;
  const map = {
    campaign: s.badgeCampaign,
    subscription: s.badgeSub,
    purchase: s.badgePurchase,
    other: s.badgeOther,
  };
  return map[tx.spendType] || s.badgeOther;
};

export default function AdsManagement() {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'clientBudgets'
  const [period, setPeriod] = useState(30);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'fund' | 'campaign' | 'entry' | 'edit' | 'reserved'
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reservedTND, setReservedTND] = useState(0);
  const [reservedInput, setReservedInput] = useState("");
  const [reservedError, setReservedError] = useState("");
  const [clients, setClients] = useState([]);

  // ── Client Budgets tab state ──────────────────────────────────────────────
  const [clientBudgets, setClientBudgets] = useState([]);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null); // clientName being edited
  const [budgetInput, setBudgetInput] = useState("");
  const [resetConfirm, setResetConfirm] = useState(null); // clientName to confirm reset
  const [deleteConfirm, setDeleteConfirm] = useState(null); // clientName to confirm delete

  // ── List New Client modal ──────────────────────────────────────────────────
  const [listClientForm, setListClientForm] = useState({
    clientName: "",
    totalBudget: "",
    notes: "",
  });
  const [listClientError, setListClientError] = useState("");
  const [listClientSubmitting, setListClientSubmitting] = useState(false);

  // ── Add Campaign per card ──────────────────────────────────────────────────
  const [addCampaignFor, setAddCampaignFor] = useState(null); // clientName
  const [addCampaignForm, setAddCampaignForm] = useState({
    campaignName: "",
    amountUSD: "",
    notes: "",
  });
  const [addCampaignError, setAddCampaignError] = useState("");
  const [addCampaignSubmitting, setAddCampaignSubmitting] = useState(false);

  const loadAll = useCallback(async (p = period) => {
    try {
      setLoading(true);
      const [sum, txData, sett, clientsData, budgetsData] = await Promise.all([
        AdsService.getSummary(p),
        AdsService.getTransactions(),
        AdsService.getSettings(),
        getClients(),
        AdsService.getClientBudgets(),
      ]);
      setSummary(sum);
      setTransactions(txData.transactions);
      setReservedTND(sett.reservedTND ?? 0);
      setClients(clientsData.clients ?? clientsData ?? []);
      setClientBudgets(budgetsData.clients ?? []);
    } catch (err) {
      console.error("AdsManagement load error:", err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    loadAll(period);
  }, [period]); // eslint-disable-line

  const handleDeleteCard = async (clientName) => {
    try {
      await AdsService.deleteClientBudget(clientName);
      setClientBudgets((prev) =>
        prev.filter((cb) => cb.clientName !== clientName),
      );
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Delete card error:", err);
    }
  };

  const loadClientBudgets = useCallback(async () => {
    try {
      setBudgetLoading(true);
      const data = await AdsService.getClientBudgets();
      setClientBudgets(data.clients ?? []);
    } catch (err) {
      console.error("ClientBudgets load error:", err);
    } finally {
      setBudgetLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "clientBudgets") loadClientBudgets();
  }, [activeTab]); // eslint-disable-line

  const handleSaveBudget = async (clientName) => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val < 0) return;
    try {
      await AdsService.upsertClientBudget(clientName, val);
      setEditingBudget(null);
      setBudgetInput("");
      loadClientBudgets();
    } catch (err) {
      console.error("Save budget error:", err);
    }
  };

  const handleResetBudget = async (clientName) => {
    try {
      await AdsService.resetClientBudget(clientName);
      setResetConfirm(null);
      loadClientBudgets();
    } catch (err) {
      console.error("Reset budget error:", err);
    }
  };

  // ── List New Client handlers ───────────────────────────────────────────────

  const openListClient = () => {
    setListClientForm({ clientName: "", totalBudget: "", notes: "" });
    setListClientError("");
    setModal("listClient");
  };

  const handleListClientSubmit = async (e) => {
    e.preventDefault();
    setListClientError("");
    if (!listClientForm.clientName) {
      setListClientError("Please select a client.");
      return;
    }
    const exists = clientBudgets.some(
      (cb) => cb.clientName === listClientForm.clientName,
    );
    if (exists) {
      setListClientError("This client already has a budget card.");
      return;
    }
    const totalBudget = parseFloat(listClientForm.totalBudget) || 0;
    setListClientSubmitting(true);
    try {
      await AdsService.upsertClientBudget(
        listClientForm.clientName,
        totalBudget,
        listClientForm.notes,
      );
      setModal(null);
      setActiveTab("clientBudgets");
      loadClientBudgets();
    } catch (err) {
      setListClientError(err.response?.data?.message || "Failed to save.");
    } finally {
      setListClientSubmitting(false);
    }
  };

  // ── Add Campaign per-card handlers ────────────────────────────────────────

  const openAddCampaign = (clientName) => {
    setAddCampaignFor(clientName);
    setAddCampaignForm({ campaignName: "", amountUSD: "", notes: "" });
    setAddCampaignError("");
  };

  const handleAddCampaignSubmit = async (e) => {
    e.preventDefault();
    setAddCampaignError("");
    const amountUSD = parseFloat(addCampaignForm.amountUSD);
    if (!addCampaignForm.campaignName.trim()) {
      setAddCampaignError("Campaign name is required.");
      return;
    }
    if (isNaN(amountUSD) || amountUSD <= 0) {
      setAddCampaignError("Amount must be greater than 0.");
      return;
    }
    setAddCampaignSubmitting(true);
    try {
      await AdsService.createTransaction({
        entryType: "spend",
        spendType: "campaign",
        campaignName: addCampaignForm.campaignName,
        clientName: addCampaignFor,
        description: addCampaignForm.campaignName,
        amountUSD,
        date: today(),
        notes: addCampaignForm.notes || "",
      });
      // Optimistically update the card so the amount reflects immediately
      setClientBudgets((prev) =>
        prev.map((cb) =>
          cb.clientName === addCampaignFor
            ? {
                ...cb,
                spent: cb.spent + amountUSD,
                campaignCount: cb.campaignCount + 1,
              }
            : cb,
        ),
      );
      setAddCampaignFor(null);
      await loadClientBudgets();
      loadAll(period);
    } catch (err) {
      setAddCampaignError(
        err.response?.data?.message || "Failed to save campaign.",
      );
    } finally {
      setAddCampaignSubmitting(false);
    }
  };

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openFund = () => {
    setFormError("");
    setEditTarget(null);
    setForm({
      entryType: "fund",
      description: "",
      amountUSD: "",
      amountTND: "",
      date: today(),
      notes: "",
    });
    setModal("fund");
  };

  const openCampaign = () => {
    setFormError("");
    setEditTarget(null);
    setForm({
      entryType: "spend",
      spendType: "campaign",
      campaignName: "",
      clientName: "",
      description: "",
      amountUSD: "",
      date: today(),
      notes: "",
    });
    setModal("campaign");
  };

  const openEntry = () => {
    setFormError("");
    setEditTarget(null);
    setForm({
      entryType: "spend",
      spendType: "subscription",
      description: "",
      amountUSD: "",
      date: today(),
      notes: "",
    });
    setModal("entry");
  };

  const openEdit = (tx) => {
    setFormError("");
    setEditTarget(tx);
    setForm({
      entryType: tx.entryType,
      spendType: tx.spendType || "campaign",
      campaignName: tx.campaignName || "",
      clientName: tx.clientName || "",
      description: tx.description || "",
      amountUSD: tx.amountUSD || "",
      date: tx.date ? tx.date.split("T")[0] : today(),
      notes: tx.notes || "",
    });
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setEditTarget(null);
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validate TND for fund entries
    if (form.entryType === "fund") {
      const tndVal = parseFloat(form.amountTND);
      if (isNaN(tndVal) || tndVal <= 0) {
        setFormError("Amount (TND) must be greater than 0.");
        return;
      }
      if (tndVal > reservedTND) {
        setFormError(
          `Amount (TND) cannot exceed the reserved amount (${fmtTNDRaw(reservedTND)}).`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        entryType: form.entryType,
        description: form.description,
        amountUSD: parseFloat(form.amountUSD),
        date: form.date,
        notes: form.notes || "",
      };
      if (form.entryType === "fund") {
        payload.amountTND = parseFloat(form.amountTND);
      }
      if (form.entryType === "spend") {
        payload.spendType = form.spendType;
        if (form.spendType === "campaign") {
          payload.campaignName = form.campaignName;
          payload.clientName = form.clientName;
        }
      }

      if (editTarget) {
        await AdsService.updateTransaction(editTarget._id, payload);
      } else {
        const saved = await AdsService.createTransaction(payload);
        // Reflect immediately if backend decremented reservedTND
        if (payload.entryType === "fund" && payload.amountTND) {
          setReservedTND((prev) => Math.max(0, prev - payload.amountTND));
        }
      }

      closeModal();
      loadAll(period);
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Failed to save. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await AdsService.deleteTransaction(deleteId);
      setDeleteId(null);
      loadAll(period);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const openReservedModal = () => {
    setReservedInput(String(reservedTND));
    setReservedError("");
    setModal("reserved");
  };

  const handleSaveReserved = async (e) => {
    e.preventDefault();
    const val = parseFloat(reservedInput);
    if (isNaN(val) || val < 0) {
      setReservedError("Please enter a valid amount (≥ 0).");
      return;
    }
    setSubmitting(true);
    try {
      const sett = await AdsService.updateSettings({ reservedTND: val });
      setReservedTND(sett.reservedTND);
      setModal(null);
    } catch (err) {
      setReservedError(err.response?.data?.message || "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Derived values ───────────────────────────────────────────────────────

  const tndConvert = (usd) =>
    usd ? `= ${(parseFloat(usd) * USD_TO_TND).toFixed(2)} TND` : "";

  const currentPeriodLabel =
    PERIODS.find((p) => p.value === period)?.label || "";

  const {
    totalSpentAllTimeUSD = 0,
    remainingUSD = 0,
    spentInPeriodUSD = 0,
    chartData = [],
  } = summary || {};

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ads & USDT</h1>
          <p className={styles.subtitle}>
            Advertising budget · USDT capital management · 1 USD = 3.5 TND
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.fundBtn} onClick={openFund}>
            <MdAddCircle /> Add Funds
          </button>
          <button className={styles.campaignBtn} onClick={openListClient}>
            <MdPeople /> List New Client
          </button>
          <button className={styles.entryBtn} onClick={openEntry}>
            <MdAdd /> Add Entry
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === "overview" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <MdAttachMoney /> Overview
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "clientBudgets" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("clientBudgets")}
        >
          <MdPeople /> Client Budgets
        </button>
      </div>

      {/* ═══════════════════════ TAB CONTENT ═══════════════════════════ */}

      {activeTab === "overview" && (
        <>
          <div className={styles.periodBar}>
            <MdFilterList className={styles.filterIcon} />
            <span className={styles.filterLabel}>Period:</span>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                className={`${styles.periodBtn} ${period === p.value ? styles.periodBtnActive : ""}`}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* ── Stats grid ── */}
          <div className={styles.statsGrid}>
            {/* Spent in period */}
            <div className={`${styles.statCard} ${styles.statSpent}`}>
              <div className={styles.statIcon}>
                <MdTrendingDown />
              </div>
              <div className={styles.statBody}>
                <span className={styles.statLabel}>
                  Spent ({currentPeriodLabel})
                </span>
                <span className={styles.statValue}>
                  {fmtUSD(spentInPeriodUSD)}
                </span>
                <span className={styles.statSub}>
                  {fmtTND(spentInPeriodUSD)}
                </span>
              </div>
            </div>

            {/* Remaining */}
            <div className={`${styles.statCard} ${styles.statRemaining}`}>
              <div className={styles.statIcon}>
                <MdAttachMoney />
              </div>
              <div className={styles.statBody}>
                <span className={styles.statLabel}>Remaining Balance</span>
                <span className={styles.statValue}>{fmtUSD(remainingUSD)}</span>
                <span className={styles.statSub}>{fmtTND(remainingUSD)}</span>
              </div>
            </div>

            {/* TND Reserved */}
            <div className={`${styles.statCard} ${styles.statReserved}`}>
              <div className={styles.statIcon}>
                <MdAccountBalanceWallet />
              </div>
              <div className={styles.statBody}>
                <span className={styles.statLabel}>
                  TND Reserved (next buy)
                </span>
                <span className={styles.statValue}>
                  {fmtTNDRaw(reservedTND)}
                </span>
                <span className={styles.statSub}>
                  ≈ {fmtUSD(reservedTND / USD_TO_TND)}
                </span>
              </div>
              <button
                className={styles.editReservedBtn}
                onClick={openReservedModal}
                title="Set reserved amount"
              >
                <MdEditNote />
              </button>
            </div>
          </div>

          {/* ── Chart ── */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h2 className={styles.chartTitle}>Spending Trend</h2>
              <span className={styles.chartPeriodTag}>
                {currentPeriodLabel}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="adsSpentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c12de0" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#c12de0" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="adsFundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--text-light)" }}
                  tickFormatter={(d) => {
                    const dt = new Date(d);
                    return `${dt.getDate()}/${dt.getMonth() + 1}`;
                  }}
                  interval={Math.max(
                    0,
                    Math.floor((chartData.length || 1) / 8) - 1,
                  )}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-light)" }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid rgba(193,45,224,0.3)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  formatter={(value, name) => [
                    `$${value.toFixed(2)}`,
                    name === "spent" ? "Spent" : "Funded",
                  ]}
                  labelFormatter={(d) =>
                    new Date(d).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })
                  }
                />
                <Legend
                  formatter={(v) => (v === "spent" ? "Spent 💸" : "Funded 💰")}
                  wrapperStyle={{ fontSize: 13 }}
                />
                <Area
                  type="monotone"
                  dataKey="spent"
                  stroke="#c12de0"
                  fill="url(#adsSpentGrad)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="funded"
                  stroke="#10b981"
                  fill="url(#adsFundGrad)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Transaction history ── */}
          <div className={styles.historyCard}>
            <div className={styles.historyHeader}>
              <h2 className={styles.historyTitle}>
                <MdHistory /> Transaction History
              </h2>
              <span className={styles.txCount}>
                {transactions.length} entries
              </span>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description / Campaign</th>
                    <th>Client</th>
                    <th>Amount (USD)</th>
                    <th>Amount (TND)</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.emptyRow}>
                        No transactions yet — add funds or record a campaign to
                        get started.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr
                        key={tx._id}
                        className={
                          tx.entryType === "fund" ? styles.fundRow : ""
                        }
                      >
                        <td>
                          <span
                            className={`${styles.badge} ${typeBadgeClass(tx, styles)}`}
                          >
                            {typeLabel(tx)}
                          </span>
                        </td>
                        <td>
                          {tx.spendType === "campaign" && tx.campaignName ? (
                            <span className={styles.campaignCell}>
                              <strong>{tx.campaignName}</strong>
                              {tx.description && (
                                <span className={styles.txDesc}>
                                  — {tx.description}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span>{tx.description}</span>
                          )}
                        </td>
                        <td>
                          {tx.clientName || (
                            <span className={styles.na}>—</span>
                          )}
                        </td>
                        <td
                          className={
                            tx.entryType === "fund"
                              ? styles.amountPos
                              : styles.amountNeg
                          }
                        >
                          {tx.entryType === "fund" ? "+" : "−"}
                          {fmtUSD(tx.amountUSD)}
                        </td>
                        <td
                          className={
                            tx.entryType === "fund"
                              ? styles.amountPos
                              : styles.amountNeg
                          }
                        >
                          {tx.entryType === "fund" ? "+" : "−"}
                          {((tx.amountUSD || 0) * USD_TO_TND).toLocaleString(
                            "fr-TN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}{" "}
                          TND
                        </td>
                        <td>{fmtDate(tx.date)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button
                              className={styles.editBtn}
                              onClick={() => openEdit(tx)}
                              title="Edit"
                            >
                              <MdEdit />
                            </button>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => setDeleteId(tx._id)}
                              title="Delete"
                            >
                              <MdDelete />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Client Budgets tab ── */}
      {activeTab === "clientBudgets" && (
        <div className={styles.clientBudgetsPanel}>
          <div className={styles.cbHeader}>
            <h2 className={styles.cbTitle}>Client Ad Budgets</h2>
            <button
              className={styles.cbRefreshBtn}
              onClick={loadClientBudgets}
              title="Refresh"
            >
              <MdRefresh />
            </button>
          </div>

          {budgetLoading ? (
            <div className={styles.budgetLoading}>
              <div className={styles.spinner} />
            </div>
          ) : clientBudgets.length === 0 ? (
            <div className={styles.cbEmpty}>
              No campaign transactions yet. Add a campaign to see client budgets
              here.
            </div>
          ) : (
            <div className={styles.cbGrid}>
              {clientBudgets.map((cb) => {
                const pct =
                  cb.totalBudget > 0
                    ? Math.min(100, (cb.spent / cb.totalBudget) * 100)
                    : 0;
                const remaining = Math.max(0, cb.totalBudget - cb.spent);
                const isOver = cb.totalBudget > 0 && cb.spent > cb.totalBudget;
                const isEditing = editingBudget === cb.clientName;

                return (
                  <div key={cb.clientName} className={styles.cbCard}>
                    {/* Card header */}
                    <div className={styles.cbCardHeader}>
                      <div className={styles.cbClientName}>{cb.clientName}</div>
                      <span className={styles.cbCampaignBadge}>
                        {cb.campaignCount} campaign
                        {cb.campaignCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Budget progress */}
                    <div className={styles.cbAmounts}>
                      <span
                        className={`${styles.cbSpent} ${isOver ? styles.cbOver : ""}`}
                      >
                        $
                        {cb.spent.toLocaleString("en", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className={styles.cbSep}>/</span>
                      <span className={styles.cbTotal}>
                        $
                        {cb.totalBudget.toLocaleString("en", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className={styles.cbBar}>
                      <div
                        className={`${styles.cbBarFill} ${isOver ? styles.cbBarOver : pct >= 80 ? styles.cbBarWarn : ""}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className={styles.cbRemaining}>
                      {isOver ? (
                        <span className={styles.cbOverText}>
                          Over budget by $
                          {(cb.spent - cb.totalBudget).toFixed(2)}
                        </span>
                      ) : (
                        <span>
                          Remaining:{" "}
                          <strong>
                            $
                            {remaining.toLocaleString("en", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </strong>
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={styles.cbActions}>
                      {isEditing ? (
                        <div className={styles.cbEditRow}>
                          <span className={styles.cbEditLabel}>Total $</span>
                          <input
                            className={styles.cbEditInput}
                            type="number"
                            min="0"
                            step="0.01"
                            value={budgetInput}
                            onChange={(e) => setBudgetInput(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleSaveBudget(cb.clientName);
                              if (e.key === "Escape") setEditingBudget(null);
                            }}
                          />
                          <button
                            className={styles.cbSaveBtn}
                            onClick={() => handleSaveBudget(cb.clientName)}
                          >
                            <MdCheck />
                          </button>
                          <button
                            className={styles.cbCancelEditBtn}
                            onClick={() => setEditingBudget(null)}
                          >
                            <MdClose />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            className={styles.cbAddCampaignBtn}
                            onClick={() => openAddCampaign(cb.clientName)}
                            title="Add a new campaign for this client"
                          >
                            <MdCampaign /> Add Campaign
                          </button>
                          <button
                            className={styles.cbEditBtn}
                            onClick={() => {
                              setEditingBudget(cb.clientName);
                              setBudgetInput(String(cb.totalBudget));
                            }}
                            title="Edit total budget"
                          >
                            <MdEdit /> Edit Budget
                          </button>
                          <button
                            className={styles.cbResetBtn}
                            onClick={() => setResetConfirm(cb.clientName)}
                            title="Start new campaign period (reset spent to 0)"
                          >
                            <MdRefresh /> New Period
                          </button>
                          <button
                            className={styles.cbDeleteBtn}
                            onClick={() => setDeleteConfirm(cb.clientName)}
                            title="Delete this client card"
                          >
                            <MdDelete /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete card confirm */}
      {deleteConfirm && (
        <div className={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete Client Card</h3>
            <p>
              This will permanently delete the card for{" "}
              <strong>{deleteConfirm}</strong> and all its campaign
              transactions. This cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className={styles.deleteConfirmBtn}
                onClick={() => handleDeleteCard(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirm */}
      {resetConfirm && (
        <div className={styles.overlay} onClick={() => setResetConfirm(null)}>
          <div
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Start New Campaign Period</h3>
            <p>
              This will reset the spend tracking for{" "}
              <strong>{resetConfirm}</strong> to <strong>$0</strong>. Existing
              transactions are kept — only new campaigns after this point will
              count.
            </p>
            <div className={styles.formActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setResetConfirm(null)}
              >
                Cancel
              </button>
              <button
                className={styles.deleteConfirmBtn}
                onClick={() => handleResetBudget(resetConfirm)}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════ MODALS ════════════════════════════ */}

      {/* List New Client */}
      {modal === "listClient" && (
        <div className={styles.overlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>List New Client</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setModal(null)}
              >
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleListClientSubmit} className={styles.form}>
              <label>
                Client <span className={styles.req}>*</span>
              </label>
              <select
                value={listClientForm.clientName}
                onChange={(e) =>
                  setListClientForm((p) => ({
                    ...p,
                    clientName: e.target.value,
                  }))
                }
                required
              >
                <option value="">— Select a client —</option>
                {clients
                  .filter(
                    (c) =>
                      !clientBudgets.some(
                        (cb) => cb.clientName === c.businessName,
                      ),
                  )
                  .map((c) => (
                    <option key={c._id} value={c.businessName}>
                      {c.businessName}
                    </option>
                  ))}
              </select>

              <label>Total to Spend (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={listClientForm.totalBudget}
                onChange={(e) =>
                  setListClientForm((p) => ({
                    ...p,
                    totalBudget: e.target.value,
                  }))
                }
              />

              <label>Notes</label>
              <textarea
                rows={3}
                placeholder="Optional notes about this client's ad budget…"
                value={listClientForm.notes}
                onChange={(e) =>
                  setListClientForm((p) => ({ ...p, notes: e.target.value }))
                }
              />

              {listClientError && (
                <p className={styles.errorMsg}>{listClientError}</p>
              )}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.submitBtn} ${styles.submitCampaign}`}
                  disabled={listClientSubmitting}
                >
                  {listClientSubmitting ? "Adding…" : "Add Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Campaign for a specific client */}
      {addCampaignFor && (
        <div className={styles.overlay} onClick={() => setAddCampaignFor(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                New Campaign —{" "}
                <span className={styles.modalClientLabel}>
                  {addCampaignFor}
                </span>
              </h3>
              <button
                className={styles.closeBtn}
                onClick={() => setAddCampaignFor(null)}
              >
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleAddCampaignSubmit} className={styles.form}>
              <label>
                Campaign Name <span className={styles.req}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Facebook Ads — Spring 2026"
                value={addCampaignForm.campaignName}
                onChange={(e) =>
                  setAddCampaignForm((p) => ({
                    ...p,
                    campaignName: e.target.value,
                  }))
                }
                required
                autoFocus
              />

              <label>
                Amount (USD) <span className={styles.req}>*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={addCampaignForm.amountUSD}
                onChange={(e) =>
                  setAddCampaignForm((p) => ({
                    ...p,
                    amountUSD: e.target.value,
                  }))
                }
                required
              />
              {addCampaignForm.amountUSD > 0 && (
                <p className={styles.tndHint}>
                  ={" "}
                  {(parseFloat(addCampaignForm.amountUSD) * USD_TO_TND).toFixed(
                    2,
                  )}{" "}
                  TND
                </p>
              )}

              <label>Notes</label>
              <textarea
                rows={2}
                placeholder="Optional notes…"
                value={addCampaignForm.notes}
                onChange={(e) =>
                  setAddCampaignForm((p) => ({ ...p, notes: e.target.value }))
                }
              />

              {addCampaignError && (
                <p className={styles.errorMsg}>{addCampaignError}</p>
              )}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setAddCampaignFor(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.submitBtn} ${styles.submitCampaign}`}
                  disabled={addCampaignSubmitting}
                >
                  {addCampaignSubmitting ? "Saving…" : "Save Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Funds */}
      {modal === "fund" && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Funds</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <label>
                Description <span className={styles.req}>*</span>
              </label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                placeholder="e.g. USDT purchase, bank transfer…"
              />

              <label>
                Amount (USD) <span className={styles.req}>*</span>
              </label>
              <input
                name="amountUSD"
                type="number"
                step="0.01"
                min="0.01"
                value={form.amountUSD}
                onChange={handleChange}
                required
                placeholder="0.00"
              />

              <label>
                Amount (TND) paid <span className={styles.req}>*</span>
              </label>
              <input
                name="amountTND"
                type="number"
                step="0.01"
                min="0.01"
                max={reservedTND > 0 ? reservedTND : undefined}
                value={form.amountTND}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
              <p
                className={
                  parseFloat(form.amountTND) > reservedTND
                    ? styles.tndError
                    : styles.tndHint
                }
              >
                Reserved: {fmtTNDRaw(reservedTND)}
                {form.amountTND !== "" &&
                  !isNaN(parseFloat(form.amountTND)) && (
                    <>
                      {" "}
                      &rarr; after:{" "}
                      <strong>
                        {fmtTNDRaw(
                          Math.max(0, reservedTND - parseFloat(form.amountTND)),
                        )}
                      </strong>
                    </>
                  )}
              </p>

              <label>
                Date <span className={styles.req}>*</span>
              </label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />

              <label>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Optional notes…"
              />

              {formError && <p className={styles.errorMsg}>{formError}</p>}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.submitBtn} ${styles.submitFund}`}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Add Funds"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Campaign */}
      {modal === "campaign" && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>New Campaign Expense</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <label>
                Campaign Name <span className={styles.req}>*</span>
              </label>
              <input
                name="campaignName"
                value={form.campaignName}
                onChange={handleChange}
                required
                placeholder="e.g. Facebook Ads — Spring 2025"
              />

              <label>
                Client <span className={styles.req}>*</span>
              </label>
              <select
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                required
              >
                <option value="">— Select a client —</option>
                {clients.map((c) => (
                  <option key={c._id} value={c.businessName}>
                    {c.businessName}
                  </option>
                ))}
              </select>

              <label>Description</label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional details about this campaign…"
              />

              <label>
                Amount (USD) <span className={styles.req}>*</span>
              </label>
              <input
                name="amountUSD"
                type="number"
                step="0.01"
                min="0.01"
                value={form.amountUSD}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
              {form.amountUSD > 0 && (
                <p className={styles.tndHint}>{tndConvert(form.amountUSD)}</p>
              )}

              <label>
                Date <span className={styles.req}>*</span>
              </label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />

              <label>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Optional notes…"
              />

              {formError && <p className={styles.errorMsg}>{formError}</p>}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.submitBtn} ${styles.submitCampaign}`}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Save Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Entry (subscription / purchase / other) */}
      {modal === "entry" && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Expense Entry</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <label>
                Type <span className={styles.req}>*</span>
              </label>
              <select
                name="spendType"
                value={form.spendType}
                onChange={handleChange}
                required
              >
                <option value="subscription">Subscription</option>
                <option value="purchase">Purchase</option>
                <option value="other">Other</option>
              </select>

              <label>
                Description <span className={styles.req}>*</span>
              </label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                placeholder="What did you subscribe to / buy?"
              />

              <label>
                Amount (USD) <span className={styles.req}>*</span>
              </label>
              <input
                name="amountUSD"
                type="number"
                step="0.01"
                min="0.01"
                value={form.amountUSD}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
              {form.amountUSD > 0 && (
                <p className={styles.tndHint}>{tndConvert(form.amountUSD)}</p>
              )}

              <label>
                Date <span className={styles.req}>*</span>
              </label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />

              <label>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Optional notes…"
              />

              {formError && <p className={styles.errorMsg}>{formError}</p>}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit */}
      {modal === "edit" && editTarget && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Edit Entry</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              {editTarget.entryType === "spend" && (
                <>
                  <label>Type</label>
                  <select
                    name="spendType"
                    value={form.spendType}
                    onChange={handleChange}
                  >
                    <option value="campaign">Campaign</option>
                    <option value="subscription">Subscription</option>
                    <option value="purchase">Purchase</option>
                    <option value="other">Other</option>
                  </select>

                  {form.spendType === "campaign" && (
                    <>
                      <label>Campaign Name</label>
                      <input
                        name="campaignName"
                        value={form.campaignName}
                        onChange={handleChange}
                        placeholder="Campaign name…"
                      />
                      <label>Client</label>
                      <select
                        name="clientName"
                        value={form.clientName}
                        onChange={handleChange}
                      >
                        <option value="">— Select a client —</option>
                        {clients.map((c) => (
                          <option key={c._id} value={c.businessName}>
                            {c.businessName}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </>
              )}

              <label>
                Description <span className={styles.req}>*</span>
              </label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                required
              />

              <label>
                Amount (USD) <span className={styles.req}>*</span>
              </label>
              <input
                name="amountUSD"
                type="number"
                step="0.01"
                min="0.01"
                value={form.amountUSD}
                onChange={handleChange}
                required
              />
              {form.amountUSD > 0 && (
                <p className={styles.tndHint}>{tndConvert(form.amountUSD)}</p>
              )}

              <label>
                Date <span className={styles.req}>*</span>
              </label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />

              <label>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
              />

              {formError && <p className={styles.errorMsg}>{formError}</p>}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Reserved TND */}
      {modal === "reserved" && (
        <div className={styles.overlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Set Reserved TND</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setModal(null)}
              >
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSaveReserved} className={styles.form}>
              <p className={styles.reservedNote}>
                This is the TND amount you have physically set aside to buy more
                USDT for the next purchase.
              </p>
              <label>
                Amount (TND) <span className={styles.req}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={reservedInput}
                onChange={(e) => setReservedInput(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
              {reservedInput !== "" && parseFloat(reservedInput) >= 0 && (
                <p className={styles.tndHint}>
                  ≈ {fmtUSD(parseFloat(reservedInput) / USD_TO_TND)}
                </p>
              )}
              {reservedError && (
                <p className={styles.errorMsg}>{reservedError}</p>
              )}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.submitBtn} ${styles.submitFund}`}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className={styles.overlay} onClick={() => setDeleteId(null)}>
          <div
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete Entry</h3>
            <p>Are you sure? This action cannot be undone.</p>
            <div className={styles.formActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className={styles.deleteConfirmBtn}
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
