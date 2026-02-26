import React, { useState, useEffect, useCallback } from 'react';
import { MdBackup, MdCloudDone, MdError, MdSchedule, MdStorage, MdHistory, MdSend, MdSmartToy } from 'react-icons/md';
import { getBackupStatus, getBackupHistory, triggerBackup } from '../services/BackupServices';
import styles from './Backup.module.css';

const Backup = () => {
    const [status, setStatus] = useState(null);
    const [nextScheduled, setNextScheduled] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'manual' | 'scheduled'
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [statusRes, historyRes] = await Promise.all([
                getBackupStatus(),
                getBackupHistory()
            ]);
            setStatus(statusRes.lastBackup);
            setNextScheduled(statusRes.nextScheduled || null);
            setHistory(historyRes.history || []);
        } catch (error) {
            console.error('Failed to fetch backup data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleTriggerBackup = async () => {
        setTriggering(true);
        try {
            const result = await triggerBackup();
            showToast(result.message || 'Backup completed successfully!', 'success');
            await fetchData();
        } catch (error) {
            const msg = error.response?.data?.error || error.message || 'Backup failed';
            showToast(msg, 'error');
        } finally {
            setTriggering(false);
        }
    };

    const fmt = (dateStr) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <h1 className={styles.pageTitle}>Database Backup</h1>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    Loading backup information...
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.pageTitle}>Database Backup</h1>

            {toast && (
                <div className={`${styles.toast} ${styles[toast.type]}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}

            {/* Status Cards */}
            <div className={styles.statusGrid}>
                <div className={styles.statusCard}>
                    <div className={`${styles.statusIcon} ${status?.status === 'success' ? styles.success : status?.status === 'failed' ? styles.failed : styles.pending}`}>
                        {status?.status === 'success' ? <MdCloudDone /> : status?.status === 'failed' ? <MdError /> : <MdSchedule />}
                    </div>
                    <div className={styles.statusInfo}>
                        <h3>Last Backup</h3>
                        <p>{status?.status ? status.status.charAt(0).toUpperCase() + status.status.slice(1) : 'No backup yet'}</p>
                        <span className={styles.sub}>{fmt(status?.time)}</span>
                    </div>
                </div>

                <div className={styles.statusCard}>
                    <div className={`${styles.statusIcon} ${styles.info}`}>
                        <MdSchedule />
                    </div>
                    <div className={styles.statusInfo}>
                        <h3>Next Scheduled</h3>
                        <p className={styles.small}>{fmt(nextScheduled)}</p>
                    </div>
                </div>

                <div className={styles.statusCard}>
                    <div className={`${styles.statusIcon} ${styles.success}`}>
                        <MdStorage />
                    </div>
                    <div className={styles.statusInfo}>
                        <h3>Collections / Docs</h3>
                        <p>{status?.collectionsCount || 0} / {status?.totalDocuments || 0}</p>
                    </div>
                </div>

                <div className={styles.statusCard}>
                    <div className={`${styles.statusIcon} ${styles.info}`}>
                        <MdBackup />
                    </div>
                    <div className={styles.statusInfo}>
                        <h3>File Size</h3>
                        <p>{status?.fileSize || '—'}</p>
                    </div>
                </div>
            </div>

            {/* Trigger Section */}
            <div className={styles.actionSection}>
                <div className={styles.actionInfo}>
                    <h2>Back Up Now</h2>
                    <p>
                        Export all collections as JSON, compress into a ZIP, and send to the Telegram channel.
                        Automatic backups run daily at midnight.
                    </p>
                    <div className={styles.telegramInfo}>
                        <MdSend className={styles.telegramIcon} />
                        Backups are sent to Telegram automatically
                    </div>
                </div>
                <button
                    className={styles.triggerBtn}
                    onClick={handleTriggerBackup}
                    disabled={triggering}
                >
                    {triggering ? (
                        <>
                            <div className={styles.spinner}></div>
                            Backing up...
                        </>
                    ) : (
                        <>
                            <MdBackup />
                            Back Up Now
                        </>
                    )}
                </button>
            </div>

            {/* History */}
            <div className={styles.historySection}>
                <div className={styles.historyHeader}>
                    <h2><MdHistory style={{ verticalAlign: 'middle', marginRight: 8 }} />Backup History</h2>
                    <div className={styles.historyTabs}>
                        <button className={`${styles.histTab} ${historyFilter === 'all' ? styles.histTabActive : ''}`} onClick={() => setHistoryFilter('all')}>All</button>
                        <button className={`${styles.histTab} ${historyFilter === 'manual' ? styles.histTabActive : ''}`} onClick={() => setHistoryFilter('manual')}>👤 Manual</button>
                        <button className={`${styles.histTab} ${historyFilter === 'scheduled' ? styles.histTabActive : ''}`} onClick={() => setHistoryFilter('scheduled')}><MdSmartToy style={{ verticalAlign: 'middle' }} /> Bot / Scheduled</button>
                    </div>
                </div>
                {history.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <p>No backup history yet. Trigger your first backup above!</p>
                    </div>
                ) : (() => {
                    const filtered = history.filter(e => {
                        if (historyFilter === 'all') return true;
                        const method = e.details?.method || 'manual';
                        return method === historyFilter;
                    });
                    return filtered.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🔍</div>
                            <p>No {historyFilter} backups found.</p>
                        </div>
                    ) : (
                        <table className={styles.historyTable}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Triggered By</th>
                                    <th>Method</th>
                                    <th>Collections</th>
                                    <th>Documents</th>
                                    <th>Size</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((entry) => {
                                    const isScheduled = entry.details?.method === 'scheduled';
                                    return (
                                        <tr key={entry._id} className={isScheduled ? styles.scheduledRow : ''}>
                                            <td>{fmt(entry.createdAt)}</td>
                                            <td>
                                                {isScheduled && <MdSmartToy style={{ verticalAlign: 'middle', marginRight: 4, color: '#22c55e' }} />}
                                                {entry.performedBy?.name || entry.details?.triggeredBy || 'System'}
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${isScheduled ? styles.scheduled : styles.manual}`}>
                                                    {isScheduled ? '🤖 Scheduled' : '👤 Manual'}
                                                </span>
                                            </td>
                                            <td>{entry.details?.collectionsCount ?? entry.details?.collections ?? '—'}</td>
                                            <td>{entry.details?.totalDocuments ?? entry.details?.documents ?? '—'}</td>
                                            <td>{entry.details?.fileSize || '—'}</td>
                                            <td>{entry.details?.duration || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    );
                })()}
            </div>
        </div>
    );
};

export default Backup;
