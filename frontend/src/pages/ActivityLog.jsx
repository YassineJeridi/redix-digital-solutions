import React, { useState, useEffect, useCallback } from 'react';
import {
    MdHistory, MdSearch, MdRefresh, MdCreate, MdEdit,
    MdDelete, MdSwapHoriz, MdPayment, MdPersonAdd,
    MdNoteAdd, MdAttachFile, MdChevronLeft, MdChevronRight,
    MdClear, MdQueryStats, MdAccessTime, MdCategory,
} from 'react-icons/md';
import * as AuditServices from '../services/AuditServices';
import styles from './ActivityLog.module.css';

// ─── helpers ─────────────────────────────────────────────────────────────────
const ACTION_META = {
    create:                 { icon: <MdCreate />,     color: '#10b981', label: 'Create'   },
    update:                 { icon: <MdEdit />,       color: '#3b82f6', label: 'Update'   },
    delete:                 { icon: <MdDelete />,     color: '#ef4444', label: 'Delete'   },
    status_change:          { icon: <MdSwapHoriz />,  color: '#f59e0b', label: 'Status'   },
    payment_status_change:  { icon: <MdSwapHoriz />,  color: '#f59e0b', label: 'Payment'  },
    commission:             { icon: <MdPayment />,    color: '#c12de0', label: 'Commission'},
    withdrawal:             { icon: <MdPayment />,    color: '#8b5cf6', label: 'Withdraw' },
    team_assignment:        { icon: <MdPersonAdd />,  color: '#06b6d4', label: 'Team'     },
    note_added:             { icon: <MdNoteAdd />,    color: '#84cc16', label: 'Note'     },
    attachment_added:       { icon: <MdAttachFile />, color: '#64748b', label: 'File'     },
};

const ENTITY_COLORS = {
    Project: '#8b5cf6', Client: '#06b6d4', Tool: '#f59e0b',
    TeamMember: '#10b981', Expense: '#ef4444', Charge: '#ec4899',
    Invoice: '#c12de0',
};

const getAction  = (a) => ACTION_META[a]  || { icon: <MdHistory />, color: '#6b7280', label: a?.replace(/_/g,' ') || '?' };
const getEntClr  = (t) => ENTITY_COLORS[t] || '#6b7280';
const avatarClr  = (name) => {
    const colors = ['#7817b6','#06b6d4','#10b981','#f59e0b','#ec4899','#3b82f6'];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
};

const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)          return 'just now';
    if (s < 3600)        return `${Math.floor(s / 60)}m ago`;
    if (s < 86400)       return `${Math.floor(s / 3600)}h ago`;
    if (s < 2592000)     return `${Math.floor(s / 86400)}d ago`;
    return new Date(date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
};

const fullDate = (date) =>
    new Date(date).toLocaleString('en-GB', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

const fmtDetails = (log) => {
    if (!log.details) return '';
    const d = log.details;
    const parts = [];
    if (d.projectName)   parts.push(d.projectName);
    if (d.businessName)  parts.push(d.businessName);
    if (d.name)          parts.push(d.name);
    if (d.description)   parts.push(d.description);
    if (d.amount)        parts.push(`${d.amount} TND`);
    if (d.invoiceNumber) parts.push(d.invoiceNumber);
    if (d.changes) {
        Object.entries(d.changes).slice(0,3).forEach(([k, v]) => {
            if (v?.from !== undefined) parts.push(`${k}: ${v.from} → ${v.to}`);
        });
    }
    return parts.join('  •  ');
};

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ value, label, icon, accent }) {
    return (
        <div className={styles.statCard} style={{ '--accent': accent }}>
            <div className={styles.statIconWrap}>{icon}</div>
            <div className={styles.statBody}>
                <div className={styles.statValue}>{value ?? '—'}</div>
                <div className={styles.statLabel}>{label}</div>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
const ActivityLog = () => {
    const [logs,       setLogs]       = useState([]);
    const [stats,      setStats]      = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [page,       setPage]       = useState(1);
    const [pagination, setPagination] = useState({});
    const [filters,    setFilters]    = useState({
        entityType: '', action: '', search: '', startDate: '', endDate: '',
    });
    const [searchInput, setSearchInput] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await AuditServices.getAuditLogs({
                page, limit: 25,
                entityType: filters.entityType,
                action:     filters.action,
                search:     filters.search,
                startDate:  filters.startDate,
                endDate:    filters.endDate,
            });
            setLogs(data.logs || []);
            setPagination(data.pagination || {});
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page, filters]);

    const fetchStats = async () => {
        try { const d = await AuditServices.getAuditStats(); setStats(d); }
        catch (e) { console.error(e); }
    };

    useEffect(() => { fetchLogs(); }, [fetchLogs]);
    useEffect(() => { fetchStats(); }, []);

    const applyFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };
    const onSearch    = (e) => { e.preventDefault(); applyFilter('search', searchInput); };
    const clearSearch = () => { setSearchInput(''); applyFilter('search', ''); };
    const hasFilters  = filters.entityType || filters.action || filters.search || filters.startDate || filters.endDate;
    const clearAll    = () => { setFilters({ entityType:'', action:'', search:'', startDate:'', endDate:'' }); setSearchInput(''); setPage(1); };

    return (
        <div className={styles.container}>

            {/* ── Page header ── */}
            <div className={styles.pageHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}><MdHistory /></div>
                    <div>
                        <h1 className={styles.title}>Activity Log</h1>
                        <p className={styles.subtitle}>Full audit trail of system events</p>
                    </div>
                </div>
                <button className={styles.refreshBtn} onClick={() => { fetchLogs(); fetchStats(); }}>
                    <MdRefresh /> Refresh
                </button>
            </div>

            {/* ── Stats ── */}
            {stats && (
                <div className={styles.statsGrid}>
                    <StatCard value={stats.totalLogs}    label="Total Events" icon={<MdQueryStats />}  accent="#c12de0" />
                    <StatCard value={stats.recentCount}  label="Last 24 hours" icon={<MdAccessTime />} accent="#3b82f6" />
                    {stats.byEntityType?.slice(0,3).map((item, i) => (
                        <StatCard key={i} value={item.count} label={item._id}
                            icon={<MdCategory />} accent={getEntClr(item._id)} />
                    ))}
                </div>
            )}

            {/* ── Filter bar ── */}
            <div className={styles.filterBar}>
                <form className={styles.searchBox} onSubmit={onSearch}>
                    <MdSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search logs…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                        <button type="button" className={styles.clearIcon} onClick={clearSearch}><MdClear /></button>
                    )}
                </form>

                <select className={styles.filterSelect}
                    value={filters.entityType}
                    onChange={(e) => applyFilter('entityType', e.target.value)}>
                    <option value="">All Types</option>
                    {['Project','Client','Tool','TeamMember','Expense','Charge','Invoice'].map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>

                <select className={styles.filterSelect}
                    value={filters.action}
                    onChange={(e) => applyFilter('action', e.target.value)}>
                    <option value="">All Actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="status_change">Status Change</option>
                    <option value="commission">Commission</option>
                    <option value="withdrawal">Withdrawal</option>
                </select>

                <input type="date" className={styles.datePicker}
                    value={filters.startDate}
                    onChange={(e) => applyFilter('startDate', e.target.value)} />
                <span className={styles.dateSep}>→</span>
                <input type="date" className={styles.datePicker}
                    value={filters.endDate}
                    onChange={(e) => applyFilter('endDate', e.target.value)} />

                {hasFilters && (
                    <button className={styles.clearAllBtn} onClick={clearAll}>
                        <MdClear /> Clear
                    </button>
                )}
            </div>

            {/* ── Timeline ── */}
            {loading ? (
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <p>Loading activity…</p>
                </div>
            ) : logs.length === 0 ? (
                <div className={styles.emptyState}>
                    <MdHistory size={56} />
                    <p>No activity logs found</p>
                    {hasFilters && <button className={styles.clearAllBtn} onClick={clearAll}><MdClear /> Clear filters</button>}
                </div>
            ) : (
                <div className={styles.timeline}>
                    {logs.map((log) => {
                        const am   = getAction(log.action);
                        const name = log.userName || log.performedBy?.name || 'System';
                        const details = fmtDetails(log);
                        return (
                            <div key={log._id} className={styles.logEntry}>
                                {/* timeline dot */}
                                <div className={styles.dot} style={{ background: am.color, boxShadow: `0 0 0 4px ${am.color}22` }} />

                                <div className={styles.logCard} style={{ '--action-color': am.color }}>
                                    {/* user avatar */}
                                    <div className={styles.avatar}
                                        style={{ background: avatarClr(name) }}>
                                        {name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* content */}
                                    <div className={styles.logBody}>
                                        <div className={styles.logTopRow}>
                                            <span className={styles.logUser}>{name}</span>
                                            <span className={styles.actionPill} style={{
                                                background: `${am.color}18`,
                                                color: am.color,
                                                border: `1px solid ${am.color}40`,
                                            }}>
                                                {am.icon} {am.label}
                                            </span>
                                            <span className={styles.entityPill} style={{
                                                background: `${getEntClr(log.entityType)}12`,
                                                color: getEntClr(log.entityType),
                                                border: `1px solid ${getEntClr(log.entityType)}35`,
                                            }}>
                                                {log.entityType}
                                            </span>
                                            <span className={styles.logTime} title={fullDate(log.createdAt)}>
                                                {timeAgo(log.createdAt)}
                                            </span>
                                        </div>
                                        {details && (
                                            <p className={styles.logDetails}>{details}</p>
                                        )}
                                        <time className={styles.logFullDate}>{fullDate(log.createdAt)}</time>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Pagination ── */}
            {pagination.pages > 1 && (
                <div className={styles.pagination}>
                    <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        <MdChevronLeft />
                    </button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
                        .reduce((acc, p, i, arr) => {
                            if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                            acc.push(p);
                            return acc;
                        }, [])
                        .map((p, i) =>
                            p === '…'
                                ? <span key={`sep-${i}`} className={styles.pageSep}>…</span>
                                : <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                                    onClick={() => setPage(p)}>{p}</button>
                        )
                    }
                    <button className={styles.pageBtn} disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
                        <MdChevronRight />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActivityLog;
