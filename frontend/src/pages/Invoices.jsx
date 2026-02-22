import React, { useState, useEffect, useCallback } from 'react';
import {
    MdAdd, MdSearch, MdFilterList, MdEdit, MdDelete, MdVisibility,
    MdReceiptLong, MdClose, MdKeyboardArrowDown,
} from 'react-icons/md';
import { getInvoices, deleteInvoice, updateInvoiceStatus } from '../services/InvoiceServices';
import { getClients } from '../services/ClientsServices';
import FinanceStats from '../components/Invoices/FinanceStats';
import InvoiceForm from '../components/Invoices/InvoiceForm';
import InvoiceDetail from '../components/Invoices/InvoiceDetail';
import styles from './Invoices.module.css';

const STATUSES = ['All', 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
const CATEGORIES = ['All', 'Marketing', 'Production', 'Development'];

const STATUS_COLORS = {
    Draft:     { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
    Sent:      { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
    Paid:      { bg: 'rgba(16,185,129,0.15)',  color: '#34d399' },
    Overdue:   { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
    Cancelled: { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
};

const CATEGORY_COLORS = {
    Marketing:   { bg: 'rgba(168,85,247,0.13)', color: '#a855f7' },
    Production:  { bg: 'rgba(236,72,153,0.13)', color: '#ec4899' },
    Development: { bg: 'rgba(6,182,212,0.13)',  color: '#22d3ee' },
};

export default function Invoices() {
    const [invoices, setInvoices]       = useState([]);
    const [clients, setClients]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [statsKey, setStatsKey]       = useState(0);

    // Filters
    const [category, setCategory]   = useState('All');
    const [status, setStatus]       = useState('All');
    const [clientFilter, setClientFilter] = useState('');
    const [search, setSearch]       = useState('');
    const [dateFrom, setDateFrom]   = useState('');
    const [dateTo, setDateTo]       = useState('');

    // Modals
    const [showForm, setShowForm]       = useState(false);
    const [editInvoice, setEditInvoice] = useState(null);
    const [viewInvoice, setViewInvoice] = useState(null);

    // Delete confirm
    const [deleteTarget, setDeleteTarget]   = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError]     = useState('');
    const [deleting, setDeleting]           = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (category !== 'All') params.category = category;
            if (status   !== 'All') params.status   = status;
            if (clientFilter)       params.client   = clientFilter;
            if (search)             params.search   = search;
            if (dateFrom)           params.from     = dateFrom;
            if (dateTo)             params.to       = dateTo;
            const data = await getInvoices(params);
            setInvoices(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [category, status, clientFilter, search, dateFrom, dateTo]);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => { getClients().then(setClients).catch(console.error); }, []);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateInvoiceStatus(id, newStatus);
            setInvoices(prev => prev.map(inv =>
                inv._id === id ? { ...inv, status: newStatus } : inv
            ));
            setStatsKey(k => k + 1);
        } catch (e) { console.error(e); }
    };

    const handleFormSave = () => {
        setShowForm(false);
        setEditInvoice(null);
        fetchAll();
        setStatsKey(k => k + 1);
    };

    const openEdit = (inv) => { setEditInvoice(inv); setShowForm(true); };
    const openView = (inv) => setViewInvoice(inv);

    const openDelete = (inv) => {
        setDeleteTarget(inv);
        setDeleteConfirmText('');
        setDeleteError('');
    };

    const confirmDelete = async () => {
        if (deleteConfirmText !== deleteTarget.invoiceNumber) {
            setDeleteError('Invoice number does not match.');
            return;
        }
        setDeleting(true);
        try {
            await deleteInvoice(deleteTarget._id);
            setInvoices(prev => prev.filter(i => i._id !== deleteTarget._id));
            setDeleteTarget(null);
            setStatsKey(k => k + 1);
        } catch (e) {
            setDeleteError(e?.response?.data?.message || 'Delete failed.');
        } finally {
            setDeleting(false);
        }
    };

    const clearFilters = () => {
        setStatus('All'); setCategory('All');
        setClientFilter(''); setSearch('');
        setDateFrom(''); setDateTo('');
    };
    const hasFilters = status !== 'All' || category !== 'All' || clientFilter || search || dateFrom || dateTo;

    return (
        <div className={styles.page}>
            {/* ── HEADER ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <MdReceiptLong className={styles.headerIcon} />
                    <div>
                        <h1 className={styles.title}>Invoices</h1>
                        <p className={styles.subtitle}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found</p>
                    </div>
                </div>
                <button className={styles.newBtn} onClick={() => { setEditInvoice(null); setShowForm(true); }}>
                    <MdAdd /> New Invoice
                </button>
            </div>

            {/* ── STATS ── */}
            <FinanceStats key={statsKey} />

            {/* ── FILTER BAR ── */}
            <div className={styles.filterBar}>
                {/* Category tabs */}
                <div className={styles.categoryTabs}>
                    {CATEGORIES.map(c => (
                        <button
                            key={c}
                            className={`${styles.catTab} ${category === c ? styles.catTabActive : ''}`}
                            onClick={() => setCategory(c)}
                        >{c}</button>
                    ))}
                </div>

                <div className={styles.filterRow}>
                    {/* Search */}
                    <div className={styles.searchBox}>
                        <MdSearch className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Search by number or client…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && <button className={styles.clearSearch} onClick={() => setSearch('')}><MdClose /></button>}
                    </div>

                    {/* Status filter */}
                    <div className={styles.selectWrap}>
                        <select className={styles.filterSelect} value={status} onChange={e => setStatus(e.target.value)}>
                            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                        </select>
                        <MdKeyboardArrowDown className={styles.selectArrow} />
                    </div>

                    {/* Client filter */}
                    <div className={styles.selectWrap}>
                        <select className={styles.filterSelect} value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
                            <option value="">All Clients</option>
                            {clients.map(c => (
                                <option key={c._id} value={c._id}>{c.businessName || c.ownerName}</option>
                            ))}
                        </select>
                        <MdKeyboardArrowDown className={styles.selectArrow} />
                    </div>

                    {/* Date range */}
                    <input type="date" className={styles.dateInput} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
                    <input type="date" className={styles.dateInput} value={dateTo}   onChange={e => setDateTo(e.target.value)}   title="To date" />

                    {hasFilters && (
                        <button className={styles.clearBtn} onClick={clearFilters}>
                            <MdFilterList /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ── TABLE ── */}
            <div className={styles.tableWrap}>
                {loading ? (
                    <div className={styles.loadingRow}><div className={styles.spinner} /></div>
                ) : invoices.length === 0 ? (
                    <div className={styles.emptyState}>
                        <MdReceiptLong className={styles.emptyIcon} />
                        <p>No invoices found</p>
                        <button className={styles.newBtn} onClick={() => { setEditInvoice(null); setShowForm(true); }}>
                            <MdAdd /> Create your first invoice
                        </button>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Client</th>
                                <th>Category</th>
                                <th>Issue Date</th>
                                <th>Due Date</th>
                                <th>Total (TND)</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => {
                                const sc = STATUS_COLORS[inv.status] || STATUS_COLORS.Draft;
                                const cc = CATEGORY_COLORS[inv.category] || {};
                                return (
                                    <tr key={inv._id} className={styles.row}>
                                        <td className={styles.invNum}>{inv.invoiceNumber}</td>
                                        <td>{inv.client?.businessName || inv.client?.ownerName || '—'}</td>
                                        <td>
                                            <span className={styles.badge} style={{ background: cc.bg, color: cc.color }}>
                                                {inv.category}
                                            </span>
                                        </td>
                                        <td>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}</td>
                                        <td className={inv.status === 'Overdue' ? styles.overdue : ''}>
                                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                                        </td>
                                        <td className={styles.amount}>{Number(inv.totalAmount || 0).toFixed(3)}</td>
                                        <td>
                                            <div className={styles.statusWrap}>
                                                <select
                                                    className={styles.statusSelect}
                                                    value={inv.status}
                                                    style={{ background: sc.bg, color: sc.color, borderColor: sc.color + '55' }}
                                                    onChange={e => handleStatusChange(inv._id, e.target.value)}
                                                >
                                                    {STATUSES.filter(s => s !== 'All').map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button className={styles.actionBtn} title="View" onClick={() => openView(inv)}>
                                                    <MdVisibility />
                                                </button>
                                                <button className={styles.actionBtn} title="Edit" onClick={() => openEdit(inv)}>
                                                    <MdEdit />
                                                </button>
                                                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={() => openDelete(inv)}>
                                                    <MdDelete />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── DELETE CONFIRM MODAL ── */}
            {deleteTarget && (
                <div className={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
                    <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
                        <h3>Delete Invoice</h3>
                        <p>This action cannot be undone. Type <strong>{deleteTarget.invoiceNumber}</strong> to confirm.</p>
                        <input
                            className={styles.deleteInput}
                            placeholder={deleteTarget.invoiceNumber}
                            value={deleteConfirmText}
                            onChange={e => { setDeleteConfirmText(e.target.value); setDeleteError(''); }}
                        />
                        {deleteError && <p className={styles.deleteError}>{deleteError}</p>}
                        <div className={styles.deleteActions}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button
                                className={styles.confirmDeleteBtn}
                                onClick={confirmDelete}
                                disabled={deleting || deleteConfirmText !== deleteTarget.invoiceNumber}
                            >
                                {deleting ? 'Deleting…' : 'Delete Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── INVOICE FORM MODAL ── */}
            {showForm && (
                <InvoiceForm
                    invoice={editInvoice}
                    clients={clients}
                    onSave={handleFormSave}
                    onClose={() => { setShowForm(false); setEditInvoice(null); }}
                />
            )}

            {/* ── INVOICE DETAIL MODAL ── */}
            {viewInvoice && (
                <InvoiceDetail
                    invoiceId={viewInvoice._id}
                    onClose={() => setViewInvoice(null)}
                    onEdit={(inv) => { setViewInvoice(null); openEdit(inv); }}
                    onStatusChange={() => { fetchAll(); setStatsKey(k => k + 1); }}
                />
            )}
        </div>
    );
}
