import React, { useState, useEffect } from "react";
import {
  MdReceipt,
  MdDownload,
  MdCheckCircle,
  MdFavorite,
  MdHandshake,
} from "react-icons/md";
import * as ClientsService from "../services/ClientsServices";
import styles from "./Receipt.module.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

const Receipt = () => {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    clientName: "",
    amountPaid: "",
    date: new Date().toISOString().split("T")[0],
    paymentStatus: "paid",
    thankingOption: "continue",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const formattedAmt = form.amountPaid
    ? Number(form.amountPaid).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      })
    : "0";

  const formattedDate = form.date
    ? new Date(form.date + "T12:00:00").toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const quoteText =
    form.thankingOption === "seeYouSoon"
      ? "We hope to see you again very soon."
      : "Together, we will continue to build success.";

  useEffect(() => {
    ClientsService.getClients()
      .then((data) => setClients(data || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccess(false);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.clientName.trim())
      return setError("Please select or enter a client name.");
    if (!form.amountPaid || Number(form.amountPaid) <= 0)
      return setError("Please enter a valid paid amount.");
    if (!form.date) return setError("Please select a payment date.");

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/receipts/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName.trim(),
          amountPaid: Number(form.amountPaid),
          date: form.date,
          paymentStatus: form.paymentStatus,
          thankingOption: form.thankingOption,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to generate receipt");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${form.clientName.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <MdReceipt className={styles.headerIcon} />
          <div>
            <h1 className={styles.pageTitle}>Receipt Generator</h1>
            <p className={styles.pageSubtitle}>
              Generate a professional payment receipt for your clients
            </p>
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── FORM ───────────────────────────────────────── */}
        <div className={styles.formCard}>
          <div className={styles.cardTitleRow}>
            <h2 className={styles.cardTitle}>Receipt Details</h2>
          </div>

          <form onSubmit={handleGenerate} className={styles.form}>
            {/* Client */}
            <div className={styles.field}>
              <label className={styles.label}>Client</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>&#128100;</span>
                {clients.length > 0 ? (
                  <select
                    name="clientName"
                    value={form.clientName}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value="">— Select a client —</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c.businessName || c.ownerName}>
                        {c.businessName || c.ownerName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="clientName"
                    value={form.clientName}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter client name"
                  />
                )}
              </div>
            </div>

            {/* Amount */}
            <div className={styles.field}>
              <label className={styles.label}>Amount Paid (TND)</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>&#x24;</span>
                <input
                  type="number"
                  name="amountPaid"
                  value={form.amountPaid}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="0.000"
                  min="0"
                  step="0.001"
                />
              </div>
            </div>

            {/* Date */}
            <div className={styles.field}>
              <label className={styles.label}>Payment Date</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>&#x1F4C5;</span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Payment Status */}
            <div className={styles.field}>
              <label className={styles.label}>Payment Status</label>
              <div className={styles.toggleGroup}>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${
                    form.paymentStatus === "paid" ? styles.togglePaid : ""
                  }`}
                  onClick={() =>
                    setForm((p) => ({ ...p, paymentStatus: "paid" }))
                  }
                >
                  <MdCheckCircle /> Paid
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${
                    form.paymentStatus === "half" ? styles.toggleHalf : ""
                  }`}
                  onClick={() =>
                    setForm((p) => ({ ...p, paymentStatus: "half" }))
                  }
                >
                  Half Paid
                </button>
              </div>
            </div>

            {/* Closing message */}
            <div className={styles.field}>
              <label className={styles.label}>Closing Message</label>
              <div className={styles.msgGroup}>
                <label
                  className={`${styles.msgCard} ${
                    form.thankingOption === "continue" ? styles.msgActive : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="thankingOption"
                    value="continue"
                    checked={form.thankingOption === "continue"}
                    onChange={handleChange}
                    className={styles.radioHidden}
                  />
                  <MdHandshake className={styles.msgIcon} />
                  <div className={styles.msgText}>
                    <strong>Continuing Partners</strong>
                    <span>Together, we will continue to build success.</span>
                  </div>
                  {form.thankingOption === "continue" && (
                    <MdCheckCircle className={styles.msgCheck} />
                  )}
                </label>

                <label
                  className={`${styles.msgCard} ${
                    form.thankingOption === "seeYouSoon" ? styles.msgActive : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="thankingOption"
                    value="seeYouSoon"
                    checked={form.thankingOption === "seeYouSoon"}
                    onChange={handleChange}
                    className={styles.radioHidden}
                  />
                  <MdFavorite className={styles.msgIcon} />
                  <div className={styles.msgText}>
                    <strong>See You Soon</strong>
                    <span>We hope to see you again very soon.</span>
                  </div>
                  {form.thankingOption === "seeYouSoon" && (
                    <MdCheckCircle className={styles.msgCheck} />
                  )}
                </label>
              </div>
            </div>

            {error && <p className={styles.errorBox}>{error}</p>}
            {success && (
              <p className={styles.successBox}>
                <MdCheckCircle /> Downloaded successfully!
              </p>
            )}

            <button
              type="submit"
              className={styles.generateBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} /> Generating…
                </>
              ) : (
                <>
                  <MdDownload /> Generate &amp; Download PDF
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── PREVIEW ─────────────────────────────────────── */}
        <div className={styles.previewWrap}>
          <div className={styles.previewBar}>
            <div className={styles.previewDot} />
            Live Preview
          </div>

          <div className={styles.paper}>
            <div className={styles.paperHead}>
              <div>
                <div className={styles.paperCompany}>
                  Redix Digital Solutions
                </div>
                <div className={styles.paperTagline}>Payment Receipt</div>
              </div>
              <div className={styles.paperBadge}>RECEIPT</div>
            </div>

            <div className={styles.paperHero}>
              <div className={styles.paperHeroLabel}>Amount Paid</div>
              <div className={styles.paperHeroAmt}>
                {formattedAmt}
                <span className={styles.paperHeroCur}> TND</span>
              </div>
            </div>

            <hr className={styles.rule} />

            <div className={styles.paperRows}>
              <div className={styles.paperRow}>
                <span className={styles.paperKey}>Client</span>
                <span className={styles.paperVal}>
                  {form.clientName || "—"}
                </span>
              </div>
              <div className={styles.paperRow}>
                <span className={styles.paperKey}>Date</span>
                <span className={styles.paperVal}>{formattedDate}</span>
              </div>
              <div className={styles.paperRow}>
                <span className={styles.paperKey}>Status</span>
                {form.paymentStatus === "half" ? (
                  <span className={styles.badgeHalf}>Half Paid</span>
                ) : (
                  <span className={styles.badgePaid}>Paid</span>
                )}
              </div>
            </div>

            <div className={styles.paperQuote}>"{quoteText}"</div>

            <div className={styles.paperContact}>
              contact@redixdigitalsolutions.com · (+216) 27 941 416
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
