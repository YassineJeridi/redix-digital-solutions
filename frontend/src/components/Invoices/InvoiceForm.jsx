import React, { useState, useEffect, useCallback } from 'react';
import { MdClose, MdAdd, MdDelete, MdSend, MdSave, MdDownload, MdCode } from 'react-icons/md';
import { SiTelegram } from 'react-icons/si';
import { createInvoice, updateInvoice, exportInvoicePdf, sendInvoiceTelegram } from '../../services/InvoiceServices';
import { updateInvoiceIssued } from '../../services/ServicesServices';
import styles from './InvoiceForm.module.css';

// ── Service template line items ──────────────────────────────────────────────
const LINE_TEMPLATES = {
    Marketing: [
        { description: 'Social Media Management', unitPrice: 500 },
        { description: 'Ad Campaign', unitPrice: 800 },
        { description: 'Content Creation', unitPrice: 350 },
        { description: 'SEO Optimization', unitPrice: 600 },
        { description: 'Community Management', unitPrice: 400 },
        { description: 'Analytics Report', unitPrice: 250 },
        { description: 'Email Marketing', unitPrice: 300 },
        { description: 'Brand Consultation', unitPrice: 700 },
    ],
    Production: [
        { description: 'Pre-Production', unitPrice: 600 },
        { description: 'Shooting Day', unitPrice: 1200 },
        { description: 'Video Editing (DaVinci Resolve)', unitPrice: 900 },
        { description: 'Motion Graphics', unitPrice: 750 },
        { description: 'Color Grading', unitPrice: 500 },
        { description: 'Audio Design', unitPrice: 400 },
        { description: 'Equipment Rental', unitPrice: 800 },
        { description: 'Social Media Optimization', unitPrice: 250 },
    ],
    Development: [
        { description: 'Discovery & Planning', unitPrice: 500 },
        { description: 'UI/UX Design', unitPrice: 1200 },
        { description: 'Frontend Development (React)', unitPrice: 2000 },
        { description: 'Backend Development (Node.js)', unitPrice: 2000 },
        { description: 'Database Setup', unitPrice: 600 },
        { description: 'API Integration', unitPrice: 800 },
        { description: 'Security & Testing', unitPrice: 700 },
        { description: 'Deployment & DevOps', unitPrice: 900 },
        { description: 'Maintenance & Support', unitPrice: 500 },
    ],
};

const today = () => new Date().toISOString().split('T')[0];
const in30   = () => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
};

const emptyItem = () => ({ _id: Date.now() + Math.random(), description: '', quantity: 1, unitPrice: 0, total: 0 });

function calcItem(item) {
    return { ...item, total: parseFloat(((item.quantity || 0) * (item.unitPrice || 0)).toFixed(3)) };
}

export default function InvoiceForm({ invoice, clients = [], onSave, onClose }) {
    const isEdit = !!(invoice?._id);   // pre-fill objects without _id create a new invoice

    const [form, setForm] = useState({
        client:        invoice?.client?._id || invoice?.client || '',
        category:      invoice?.category || 'Marketing',
        issueDate:     invoice?.issueDate ? invoice.issueDate.split('T')[0] : today(),
        dueDate:       invoice?.dueDate   ? invoice.dueDate.split('T')[0]   : in30(),
        taxRate:       invoice?.taxRate   ?? 19,
        discount:      invoice?.discount  ?? 0,
        notes:         invoice?.notes     || '',
        paymentMethod: invoice?.paymentMethod || 'Bank Transfer',
        status:        invoice?.status    || 'Draft',
        service:       invoice?.serviceId || invoice?.service || null,
        lineItems:     invoice?.lineItems?.length
            ? invoice.lineItems.map(li => ({ ...li, _id: li._id || Date.now() + Math.random() }))
            : [emptyItem()],
    });

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [showTemplates, setShowTemplates] = useState(false);

    // Telegram panel
    const [showTgPanel, setShowTgPanel] = useState(false);
    const [tgSending,   setTgSending]   = useState(false);
    const [tgMsg,       setTgMsg]       = useState('');
    const [tgErr,       setTgErr]       = useState('');

    // Recalculate totals
    const subTotal     = form.lineItems.reduce((s, li) => s + (li.total || 0), 0);
    const discounted   = Math.max(0, subTotal - (form.discount || 0));
    const taxAmount    = parseFloat(((discounted * form.taxRate) / 100).toFixed(3));
    const totalAmount  = parseFloat((discounted + taxAmount).toFixed(3));

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    // ── Line item helpers ──────────────────────────────────────────────────
    const updateItem = (id, field, val) => {
        setForm(prev => ({
            ...prev,
            lineItems: prev.lineItems.map(li => {
                if (li._id !== id) return li;
                const updated = { ...li, [field]: field === 'description' ? val : parseFloat(val) || 0 };
                return calcItem(updated);
            }),
        }));
    };

    const removeItem = (id) => setForm(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter(li => li._id !== id),
    }));

    const addBlankItem = () => setForm(prev => ({ ...prev, lineItems: [...prev.lineItems, emptyItem()] }));

    const addTemplateItem = (tpl) => {
        const item = calcItem({ _id: Date.now() + Math.random(), description: tpl.description, quantity: 1, unitPrice: tpl.unitPrice, total: tpl.unitPrice });
        setForm(prev => ({ ...prev, lineItems: [...prev.lineItems, item] }));
        setShowTemplates(false);
    };

    // ── Validate ───────────────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.client)   e.client   = 'Client is required';
        if (!form.category) e.category = 'Category is required';
        if (!form.dueDate)  e.dueDate  = 'Due date is required';
        if (form.lineItems.length === 0) e.lineItems = 'Add at least one line item';
        form.lineItems.forEach((li, i) => {
            if (!li.description.trim()) e[`li_${i}`] = 'Description required';
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Submit — returns saved invoice doc ───────────────────────────────
    const handleSubmit = async (asDraft = false) => {
        if (!validate()) return null;
        setSaving(true);
        setSaveError('');
        try {
            const payload = {
                ...form,
                status: asDraft ? 'Draft' : (isEdit ? form.status : 'Sent'),
                lineItems: form.lineItems.map(({ _id, ...rest }) => rest),
                service: form.service || undefined,
            };
            let saved;
            if (isEdit) {
                saved = await updateInvoice(invoice._id, payload);
            } else {
                saved = await createInvoice(payload);
            }
            return saved;
        } catch (e) {
            setSaveError(e?.response?.data?.message || 'Failed to save invoice.');
            return null;
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDraft = async () => {
        const saved = await handleSubmit(true);
        if (saved) onSave();
    };

    const handleDownloadPdf = async () => {
        const saved = await handleSubmit(false);
        if (!saved) return;
        try {
            await exportInvoicePdf(saved._id, saved.invoiceNumber);
            const serviceId = saved.service?._id || saved.service;
            if (serviceId) updateInvoiceIssued(serviceId, true).catch(() => {});
        } catch {
            setSaveError('Invoice saved but PDF download failed.');
        }
        onSave();
    };

    const handleSendTelegram = async () => {
        setTgSending(true); setTgErr(''); setTgMsg('');
        const saved = await handleSubmit(false);
        if (!saved) { setTgSending(false); return; }
        try {
            const r = await sendInvoiceTelegram(saved._id, {});
            setTgMsg(r.message || 'Sent!');
            const serviceId = saved.service?._id || saved.service;
            if (serviceId) updateInvoiceIssued(serviceId, true).catch(() => {});
            setTimeout(() => onSave(), 1500);
        } catch (e) {
            setTgErr(e?.response?.data?.message || 'Failed to send to Telegram.');
            onSave(); // invoice was created — refresh the badge
        } finally { setTgSending(false); }
    };

    const templates = LINE_TEMPLATES[form.category] || [];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* ── HEADER ── */}
                <div className={styles.modalHeader}>
                    <h2>{isEdit ? `Edit ${invoice.invoiceNumber}` : 'New Invoice'}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><MdClose /></button>
                </div>

                <div className={styles.body}>
                    {/* ── ROW 1: Client | Category ── */}
                    <div className={styles.row2}>
                        <div className={styles.field}>
                            <label>Client <span className={styles.req}>*</span></label>
                            <select
                                className={`${styles.select} ${errors.client ? styles.invalid : ''}`}
                                value={form.client}
                                onChange={e => set('client', e.target.value)}
                            >
                                <option value="">— Select client —</option>
                                {clients.map(c => (
                                    <option key={c._id} value={c._id}>{c.businessName || c.ownerName}</option>
                                ))}
                            </select>
                            {errors.client && <span className={styles.err}>{errors.client}</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Category <span className={styles.req}>*</span></label>
                            <select
                                className={styles.select}
                                value={form.category}
                                onChange={e => set('category', e.target.value)}
                            >
                                <option value="Marketing">Marketing</option>
                                <option value="Production">Production</option>
                                <option value="Development">Development</option>
                            </select>
                        </div>
                    </div>

                    {/* ── ROW 2: Dates | Payment ── */}
                    <div className={styles.row3}>
                        <div className={styles.field}>
                            <label>Issue Date</label>
                            <input type="date" className={styles.input} value={form.issueDate} onChange={e => set('issueDate', e.target.value)} />
                        </div>
                        <div className={styles.field}>
                            <label>Due Date <span className={styles.req}>*</span></label>
                            <input
                                type="date"
                                className={`${styles.input} ${errors.dueDate ? styles.invalid : ''}`}
                                value={form.dueDate}
                                onChange={e => set('dueDate', e.target.value)}
                            />
                            {errors.dueDate && <span className={styles.err}>{errors.dueDate}</span>}
                        </div>
                        <div className={styles.field}>
                            <label>Payment Method</label>
                            <select className={styles.select} value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
                                <option>Bank Transfer</option>
                                <option>Cash</option>
                                <option>Online</option>
                            </select>
                        </div>
                    </div>

                    {/* ── LINE ITEMS ── */}
                    <div className={styles.lineSection}>
                        <div className={styles.lineSectionHeader}>
                            <span className={styles.lineSectionTitle}>Line Items</span>
                            <div className={styles.lineActions}>
                                <div className={styles.templateWrap}>
                                    <button
                                        type="button"
                                        className={styles.templateBtn}
                                        onClick={() => setShowTemplates(p => !p)}
                                    >
                                        + from {form.category} templates
                                    </button>
                                    {showTemplates && (
                                        <div className={styles.templateDropdown}>
                                            {templates.map(tpl => (
                                                <button
                                                    key={tpl.description}
                                                    className={styles.templateItem}
                                                    onClick={() => addTemplateItem(tpl)}
                                                >
                                                    <span>{tpl.description}</span>
                                                    <span className={styles.tplPrice}>{tpl.unitPrice} TND</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button type="button" className={styles.addItemBtn} onClick={addBlankItem}>
                                    <MdAdd /> Add Row
                                </button>
                            </div>
                        </div>

                        {errors.lineItems && <p className={styles.err}>{errors.lineItems}</p>}

                        <div className={styles.lineTableWrap}>
                            <table className={styles.lineTable}>
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th className={styles.numCol}>Qty</th>
                                        <th className={styles.numCol}>Unit Price</th>
                                        <th className={styles.numCol}>Total</th>
                                        <th className={styles.actCol}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.lineItems.map((li, idx) => (
                                        <tr key={li._id}>
                                            <td>
                                                <input
                                                    className={`${styles.lineInput} ${errors[`li_${idx}`] ? styles.invalid : ''}`}
                                                    placeholder="Service description"
                                                    value={li.description}
                                                    onChange={e => updateItem(li._id, 'description', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className={`${styles.lineInput} ${styles.numInput}`}
                                                    type="number" min="0" step="0.5"
                                                    value={li.quantity}
                                                    onChange={e => updateItem(li._id, 'quantity', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className={`${styles.lineInput} ${styles.numInput}`}
                                                    type="number" min="0" step="0.001"
                                                    value={li.unitPrice}
                                                    onChange={e => updateItem(li._id, 'unitPrice', e.target.value)}
                                                />
                                            </td>
                                            <td className={styles.lineTotal}>{li.total.toFixed(3)}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={styles.removeItemBtn}
                                                    onClick={() => removeItem(li._id)}
                                                    disabled={form.lineItems.length === 1}
                                                >
                                                    <MdDelete />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── SUMMARY ── */}
                    <div className={styles.summaryRow}>
                        <div className={styles.notesCol}>
                            <div className={styles.field}>
                                <label>Notes</label>
                                <textarea
                                    className={styles.textarea}
                                    rows={3}
                                    placeholder="Payment instructions, thank-you note…"
                                    value={form.notes}
                                    onChange={e => set('notes', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.totalsCol}>
                            <div className={styles.totalRow2}>
                                <div className={styles.field} style={{ flex: 1 }}>
                                    <label>Tax Rate (%)</label>
                                    <input type="number" min="0" max="100" step="0.5" className={styles.input}
                                        value={form.taxRate} onChange={e => set('taxRate', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className={styles.field} style={{ flex: 1 }}>
                                    <label>Discount (TND)</label>
                                    <input type="number" min="0" step="0.001" className={styles.input}
                                        value={form.discount} onChange={e => set('discount', parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>

                            <div className={styles.totalsBox}>
                                <div className={styles.totalLine}>
                                    <span>Subtotal</span><span>{subTotal.toFixed(3)} TND</span>
                                </div>
                                {form.discount > 0 && (
                                    <div className={`${styles.totalLine} ${styles.discountLine}`}>
                                        <span>Discount</span><span>− {Number(form.discount).toFixed(3)} TND</span>
                                    </div>
                                )}
                                <div className={styles.totalLine}>
                                    <span>TVA ({form.taxRate}%)</span><span>{taxAmount.toFixed(3)} TND</span>
                                </div>
                                <div className={`${styles.totalLine} ${styles.grandTotal}`}>
                                    <span>TOTAL</span><span>{totalAmount.toFixed(3)} TND</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {saveError && <p className={styles.saveError}>{saveError}</p>}
                </div>

                {/* ── TELEGRAM PANEL ── */}
                {showTgPanel && (
                    <div className={styles.tgPanel}>
                        <div className={styles.tgPanelHeader}>
                            <SiTelegram className={styles.tgLogo} />
                            <span>Send Invoice PDF → Redix Data / Invoices</span>
                            <button className={styles.tgPanelClose} onClick={() => { setShowTgPanel(false); setTgMsg(''); setTgErr(''); }}><MdClose /></button>
                        </div>
                        <div className={styles.tgPanelRow}>
                            <button className={styles.tgPanelSend}
                                onClick={handleSendTelegram}
                                disabled={tgSending || !!tgMsg}>
                                <MdSend /> {tgSending ? 'Sending…' : 'Send Now'}
                            </button>
                        </div>
                        {tgErr && <span className={styles.tgPanelErr}>{tgErr}</span>}
                        {tgMsg && <span className={styles.tgPanelOk}>{tgMsg}</span>}
                    </div>
                )}

                {/* ── FOOTER ── */}
                <div className={styles.footer}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>

                    <button type="button" className={styles.draftBtn} onClick={handleSaveDraft} disabled={saving}>
                        <MdSave /> Save Draft
                    </button>

                    <button type="button" className={styles.pdfBtn} onClick={handleDownloadPdf} disabled={saving}>
                        <MdDownload /> Download PDF
                    </button>

                    <button type="button" className={styles.tgBtn}
                        onClick={() => { setShowTgPanel(v => !v); setTgMsg(''); setTgErr(''); }}
                        disabled={saving}>
                        <SiTelegram /> Telegram
                    </button>
                </div>
            </div>
        </div>
    );
}
