import React, { useEffect, useState, useRef } from 'react';
import { MdClose, MdEdit, MdPrint, MdCheckCircle, MdCode, MdDownload, MdSend } from 'react-icons/md';
import {
    getInvoice,
    updateInvoiceStatus,
    exportInvoiceXml,
    exportInvoicePdf,
    sendInvoiceTelegram,
} from '../../services/InvoiceServices';
import { updateInvoiceIssued } from '../../services/ServicesServices';
import styles from './InvoiceDetail.module.css';

const STATUS_COLORS = {
    Draft:     { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: '#9ca3af' },
    Sent:      { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', border: '#60a5fa' },
    Paid:      { bg: 'rgba(16,185,129,0.15)',  color: '#34d399', border: '#34d399' },
    Overdue:   { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: '#f87171' },
    Cancelled: { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: '#fbbf24' },
};

const fmt = (n) => Number(n || 0).toFixed(3);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export default function InvoiceDetail({ invoiceId, onClose, onEdit, onStatusChange }) {
    const [invoice,  setInvoice]  = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [marking,  setMarking]  = useState(false);

    // Export
    const [exporting, setExporting] = useState('');  // 'xml' | 'pdf' | ''
    const [exportErr, setExportErr] = useState('');

    // Telegram modal
    const [showTg,    setShowTg]    = useState(false);
    const [tgSending, setTgSending] = useState(false);
    const [tgMsg,     setTgMsg]     = useState('');
    const [tgErr,     setTgErr]     = useState('');

    const printRef = useRef(null);

    useEffect(() => {
        if (!invoiceId) return;
        setLoading(true);
        getInvoice(invoiceId)
            .then(setInvoice)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [invoiceId]);

    const markAsPaid = async () => {
        setMarking(true);
        try {
            const updated = await updateInvoiceStatus(invoiceId, 'Paid');
            setInvoice(prev => ({ ...prev, status: 'Paid', paidAt: updated.paidAt }));
            if (onStatusChange) onStatusChange();
        } catch (e) {
            console.error(e);
        } finally {
            setMarking(false);
        }
    };

    const handlePrint = () => {
        const printContents = printRef.current?.innerHTML;
        if (!printContents) return;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head>
                <title>${invoice?.invoiceNumber || 'Invoice'}</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
                    body { padding: 40px; background: white; color: #111827; font-size: 13px; }
                    .print-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
                    .company-name { font-size: 24px; font-weight: 800; color: #7817b6; }
                    .company-info { font-size: 12px; color: #6b7280; line-height: 1.8; }
                    .inv-meta { text-align: right; }
                    .inv-num { font-size: 20px; font-weight: 800; color: #111827; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
                    .info-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; }
                    .info-block p { font-size: 13px; color: #111827; line-height: 1.7; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                    thead tr { background: #f8f7fa; }
                    th { padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; text-align: left; border-bottom: 1px solid #e5e7eb; }
                    td { padding: 10px 14px; font-size: 13px; color: #111827; border-bottom: 1px solid #f3f4f6; }
                    .num { text-align: right; }
                    .totals { margin-left: auto; width: 280px; }
                    .t-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
                    .t-total { font-size: 16px; font-weight: 800; padding: 12px 0; border-top: 2px solid #e5e7eb; border-bottom: none; color: #7817b6; }
                    .notes { margin-top: 32px; padding: 16px; background: #f8f7fa; border-radius: 8px; font-size: 13px; color: #6b7280; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>${printContents}</body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    const handleExportXml = async () => {
        setExporting('xml'); setExportErr('');
        try { await exportInvoiceXml(invoiceId, invoice.invoiceNumber); }
        catch { setExportErr('Failed to export XML.'); }
        finally { setExporting(''); }
    };

    const handleExportPdf = async () => {
        setExporting('pdf'); setExportErr('');
        try {
            await exportInvoicePdf(invoiceId, invoice.invoiceNumber);
        } catch {
            setExportErr('Failed to export PDF.');
            return;
        } finally {
            setExporting('');
        }
        // Update invoice status on the linked service (best-effort, after confirmed download)
        try {
            const serviceId = invoice.service?._id || invoice.service;
            if (serviceId) await updateInvoiceIssued(serviceId, true);
        } catch (e) {
            console.warn('Could not update invoice status on service:', e?.message);
        }
    };

    const handleSendTelegram = async () => {
        setTgSending(true); setTgErr(''); setTgMsg('');
        try {
            const r = await sendInvoiceTelegram(invoiceId, {});
            setTgMsg(r.message || 'Sent successfully!');
            // Update invoice status on the linked service after confirmed send
            try {
                const serviceId = invoice?.service?._id || invoice?.service;
                if (serviceId) await updateInvoiceIssued(serviceId, true);
            } catch (e) {
                console.warn('Could not update invoice status on service:', e?.message);
            }
        } catch (e) {
            setTgErr(e?.response?.data?.message || 'Failed to send to Telegram.');
        } finally { setTgSending(false); }
    };

    const sc = invoice ? (STATUS_COLORS[invoice.status] || STATUS_COLORS.Draft) : {};

    return (
        <>
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* ── ACTION BAR ── */}
                <div className={styles.actionBar}>
                    <span className={styles.invNumBadge}>{invoice?.invoiceNumber || '…'}</span>
                    <div className={styles.barActions}>
                        {invoice && invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
                            <button className={styles.paidBtn} onClick={markAsPaid} disabled={marking}>
                                <MdCheckCircle /> {marking ? 'Updating…' : 'Mark as Paid'}
                            </button>
                        )}
                        {invoice && (
                            <button className={styles.editBtn} onClick={() => onEdit(invoice)}>
                                <MdEdit /> Edit
                            </button>
                        )}
                        {invoice && (
                            <div className={styles.exportGroup}>
                                <button className={styles.xmlBtn} onClick={handleExportXml} disabled={!!exporting} title="Download XML">
                                    <MdCode /> {exporting === 'xml' ? '…' : 'XML'}
                                </button>
                                <button className={styles.pdfDlBtn} onClick={handleExportPdf} disabled={!!exporting} title="Download PDF">
                                    <MdDownload /> {exporting === 'pdf' ? '…' : 'PDF'}
                                </button>
                                <button className={styles.printBtn} onClick={handlePrint} title="Print">
                                    <MdPrint /> Print
                                </button>
                                <button className={styles.telegramBtn} onClick={() => { setShowTg(true); setTgMsg(''); setTgErr(''); }} title="Send to Telegram">
                                    <MdSend /> Telegram
                                </button>
                            </div>
                        )}
                        <button className={styles.closeBtn} onClick={onClose}><MdClose /></button>
                    </div>
                </div>
                {exportErr && <div className={styles.exportErrBar}>{exportErr}</div>}

                {/* ── PRINT CONTENT ── */}
                <div className={styles.printArea} ref={printRef}>
                    {loading ? (
                        <div className={styles.loadingBlock}><div className={styles.spinner} /></div>
                    ) : !invoice ? (
                        <p className={styles.notFound}>Invoice not found.</p>
                    ) : (
                        <>
                            {/* Company header */}
                            <div className="print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid var(--border-color)' }}>
                                <div>
                                    <div className={styles.companyName}>Redix Digital Solutions</div>
                                    <div className={styles.companyInfo}>
                                        <p>Tunis, Tunisia</p>
                                        <p>contact@redixdigital.tn</p>
                                        <p>+216 XX XXX XXX</p>
                                        <p>MF: XXXXXXXX/X/X/XXX</p>
                                    </div>
                                </div>
                                <div className={styles.invMeta}>
                                    <div className={styles.invNumber}>{invoice.invoiceNumber}</div>
                                    <div className={styles.invMetaLine}>
                                        <span
                                            className={styles.statusBadge}
                                            style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                                        >
                                            {invoice.status}
                                        </span>
                                    </div>
                                    <div className={styles.invMetaLine}>
                                        <span>Issue:</span> {fmtDate(invoice.issueDate)}
                                    </div>
                                    <div className={styles.invMetaLine}>
                                        <span>Due:</span> {fmtDate(invoice.dueDate)}
                                    </div>
                                    {invoice.paidAt && (
                                        <div className={styles.invMetaLine} style={{ color: '#34d399' }}>
                                            <span>Paid:</span> {fmtDate(invoice.paidAt)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Client + Category info */}
                            <div className={styles.infoGrid}>
                                <div className={styles.infoBlock}>
                                    <h4>Bill To</h4>
                                    <p><strong>{invoice.client?.businessName || invoice.client?.ownerName || '—'}</strong></p>
                                    {invoice.client?.ownerName && invoice.client?.businessName && (
                                        <p>{invoice.client.ownerName}</p>
                                    )}
                                    {invoice.client?.email && <p>{invoice.client.email}</p>}
                                    {invoice.client?.phone && <p>{invoice.client.phone}</p>}
                                    {invoice.client?.matriculeFiscale && <p>MF: {invoice.client.matriculeFiscale}</p>}
                                </div>
                                <div className={styles.infoBlock}>
                                    <h4>Invoice Details</h4>
                                    <p><strong>Category:</strong> {invoice.category}</p>
                                    <p><strong>Currency:</strong> {invoice.currency}</p>
                                    <p><strong>Payment:</strong> {invoice.paymentMethod}</p>
                                    {invoice.createdBy?.name && <p><strong>Prepared by:</strong> {invoice.createdBy.name}</p>}
                                </div>
                            </div>

                            {/* Line items table */}
                            <table className={styles.itemsTable}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '50%' }}>Description</th>
                                        <th className={styles.numTh}>Qty</th>
                                        <th className={styles.numTh}>Unit Price</th>
                                        <th className={styles.numTh}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.lineItems?.map((li, i) => (
                                        <tr key={i} className={styles.itemRow}>
                                            <td>{li.description}</td>
                                            <td className={styles.numTd}>{li.quantity}</td>
                                            <td className={styles.numTd}>{fmt(li.unitPrice)}</td>
                                            <td className={styles.numTd}>{fmt(li.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className={styles.totalsWrap}>
                                <div className={styles.totalRow}>
                                    <span>Subtotal</span>
                                    <span>{fmt(invoice.subTotal)} {invoice.currency}</span>
                                </div>
                                {invoice.discount > 0 && (
                                    <div className={`${styles.totalRow} ${styles.discRow}`}>
                                        <span>Discount</span>
                                        <span>− {fmt(invoice.discount)} {invoice.currency}</span>
                                    </div>
                                )}
                                <div className={styles.totalRow}>
                                    <span>TVA ({invoice.taxRate}%)</span>
                                    <span>{fmt(invoice.taxAmount)} {invoice.currency}</span>
                                </div>
                                <div className={`${styles.totalRow} ${styles.grandRow}`}>
                                    <span>TOTAL DÛ</span>
                                    <span>{fmt(invoice.totalAmount)} {invoice.currency}</span>
                                </div>
                            </div>

                            {/* Notes */}
                            {invoice.notes && (
                                <div className={styles.notesBlock}>
                                    <h4>Notes</h4>
                                    <p>{invoice.notes}</p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className={styles.printFooter}>
                                <p>Thank you for choosing Redix Digital Solutions.</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* ── TELEGRAM MODAL ── */}
        {showTg && (
            <div className={styles.tgOverlay} onClick={() => setShowTg(false)}>
                <div className={styles.tgModal} onClick={e => e.stopPropagation()}>
                    <div className={styles.tgHeader}>
                        <div className={styles.tgIcon}><MdSend /></div>
                        <div>
                            <h3>Send via Telegram</h3>
                            <p>The invoice PDF will be sent to <strong>Redix Data</strong> → Invoices.</p>
                        </div>
                        <button className={styles.tgClose} onClick={() => setShowTg(false)}><MdClose /></button>
                    </div>
                    <div className={styles.tgBody}>
                        {tgErr && <div className={styles.tgErr}>{tgErr}</div>}
                        {tgMsg && <div className={styles.tgSuccess}>{tgMsg}</div>}
                        <div className={styles.tgPreview}>
                            <span className={styles.tgPreviewLabel}>Will send: </span>
                            <code>{invoice?.invoiceNumber} — {invoice?.client?.businessName || invoice?.client?.ownerName} — {Number(invoice?.totalAmount || 0).toFixed(3)} TND</code>
                        </div>
                    </div>
                    <div className={styles.tgFooter}>
                        <button className={styles.tgCancelBtn} onClick={() => setShowTg(false)}>Cancel</button>
                        <button className={styles.tgSendBtn} onClick={handleSendTelegram}
                            disabled={tgSending || !!tgMsg}>
                            <MdSend /> {tgSending ? 'Sending…' : 'Send Invoice'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
