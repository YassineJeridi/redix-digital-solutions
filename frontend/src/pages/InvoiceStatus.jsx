import React, { useState, useEffect } from 'react';
import {
    MdSearch, MdReceiptLong, MdFilterList,
    MdCheckCircle, MdHourglassEmpty, MdWarning, MdRemoveCircle
} from 'react-icons/md';
import * as InvoiceService from '../services/InvoiceServices';
import styles from './InvoiceStatus.module.css';

const PAYMENT_STATES = ['All', 'Unpaid', 'Partially Paid', 'Fully Paid'];

const getPaymentState = (invoice) => {
    if (!invoice) return 'Unpaid';
    const svc = invoice.service;
    if (invoice.status === 'Paid' || svc?.paymentStatus === 'Done') return 'Fully Paid';
    if (svc?.paymentStatus === 'Partial') return 'Partially Paid';
    return 'Unpaid';
};

const INVOICE_STATUS_META = {
    Draft:     { label: 'Draft',     cls: 'draft' },
    Sent:      { label: 'Sent',      cls: 'sent' },
    Paid:      { label: 'Paid',      cls: 'paid' },
    Overdue:   { label: 'Overdue',   cls: 'overdue' },
    Cancelled: { label: 'Cancelled', cls: 'cancelled' },
};

const PAYMENT_STATE_META = {
    'Unpaid':         { label: 'Unpaid',         cls: 'unpaid',    icon: <MdWarning /> },
    'Partially Paid': { label: 'Partially Paid', cls: 'partial',   icon: <MdHourglassEmpty /> },
    'Fully Paid':     { label: 'Fully Paid',     cls: 'fullpaid',  icon: <MdCheckCircle /> },
};

const InvoiceStatus = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('All');

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const data = await InvoiceService.getInvoices();
            // Only include invoices linked to a service
            setInvoices((data || []).filter(inv => inv.service));
        } catch (err) {
            console.error('Error loading invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = invoices.filter(inv => {
        const state = getPaymentState(inv);
        if (paymentFilter !== 'All' && state !== paymentFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            const matchClient = inv.client?.businessName?.toLowerCase().includes(q) ||
                                inv.client?.ownerName?.toLowerCase().includes(q);
            const matchService = inv.service?.projectName?.toLowerCase().includes(q);
            const matchInvoice = inv.invoiceNumber?.toLowerCase().includes(q);
            if (!matchClient && !matchService && !matchInvoice) return false;
        }
        return true;
    });

    // Summary counts
    const counts = invoices.reduce((acc, inv) => {
        const s = getPaymentState(inv);
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Invoice Status</h1>
                    <p className={styles.subtitle}>Track payment status for all issued invoices</p>
                </div>
            </div>

            {/* Summary chips */}
            <div className={styles.summaryRow}>
                <div className={`${styles.summaryChip} ${styles.chipUnpaid}`}>
                    <MdWarning />
                    <span>Unpaid</span>
                    <strong>{counts['Unpaid'] || 0}</strong>
                </div>
                <div className={`${styles.summaryChip} ${styles.chipPartial}`}>
                    <MdHourglassEmpty />
                    <span>Partially Paid</span>
                    <strong>{counts['Partially Paid'] || 0}</strong>
                </div>
                <div className={`${styles.summaryChip} ${styles.chipFullPaid}`}>
                    <MdCheckCircle />
                    <span>Fully Paid</span>
                    <strong>{counts['Fully Paid'] || 0}</strong>
                </div>
                <div className={`${styles.summaryChip} ${styles.chipTotal}`}>
                    <MdReceiptLong />
                    <span>Total Invoiced</span>
                    <strong>{invoices.length}</strong>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.toolbar}>
                <div className={styles.searchBar}>
                    <MdSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search client, service, or invoice number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.filterTabs}>
                    {PAYMENT_STATES.map(s => (
                        <button
                            key={s}
                            className={`${styles.filterTab} ${paymentFilter === s ? styles.filterTabActive : ''}`}
                            onClick={() => setPaymentFilter(s)}
                        >
                            {s}
                            {s !== 'All' && counts[s] ? (
                                <span className={styles.filterCount}>{counts[s]}</span>
                            ) : null}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading...</p>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    {filtered.length === 0 ? (
                        <div className={styles.empty}>
                            <MdReceiptLong className={styles.emptyIcon} />
                            <p>No invoices found</p>
                            <span>Generate invoices from the Services page to see them here.</span>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Client</th>
                                    <th>Service</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Invoice Status</th>
                                    <th>Payment State</th>
                                    <th>Paid / Total</th>
                                    <th>Issue Date</th>
                                    <th>Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(inv => {
                                    const payState = getPaymentState(inv);
                                    const pMeta = PAYMENT_STATE_META[payState];
                                    const iMeta = INVOICE_STATUS_META[inv.status] || { label: inv.status, cls: 'sent' };
                                    const svc = inv.service;
                                    const amountPaid = svc?.amountPaid || 0;
                                    const totalPrice = svc?.totalPrice || inv.totalAmount || 0;
                                    return (
                                        <tr key={inv._id}>
                                            <td className={styles.invoiceNum}>{inv.invoiceNumber}</td>
                                            <td>{inv.client?.businessName || inv.client?.ownerName || '—'}</td>
                                            <td className={styles.serviceName}>{svc?.projectName || '—'}</td>
                                            <td>
                                                <span className={`${styles.categoryBadge} ${styles['cat_' + (inv.category || '')]}`}>
                                                    {inv.category}
                                                </span>
                                            </td>
                                            <td className={styles.amount}>{(inv.totalAmount || 0).toLocaleString()} TND</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles['status_' + iMeta.cls]}`}>
                                                    {iMeta.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`${styles.payStateBadge} ${styles['payState_' + pMeta.cls]}`}>
                                                    {pMeta.icon} {pMeta.label}
                                                </span>
                                            </td>
                                            <td className={styles.paidOf}>
                                                <span className={styles.paidAmount}>{amountPaid.toLocaleString()}</span>
                                                <span className={styles.paidSep}>/</span>
                                                <span className={styles.totalAmount}>{totalPrice.toLocaleString()} TND</span>
                                                {totalPrice > 0 && (
                                                    <div className={styles.progressWrap}>
                                                        <div
                                                            className={styles.progressBar}
                                                            style={{ width: `${Math.min((amountPaid / totalPrice) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                            <td>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}</td>
                                            <td>
                                                <span className={
                                                    inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'Paid'
                                                        ? styles.overdueDate : ''
                                                }>
                                                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default InvoiceStatus;
