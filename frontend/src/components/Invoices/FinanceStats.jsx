import React, { useEffect, useState } from 'react';
import { MdCheckCircle, MdSchedule, MdWarning, MdBarChart } from 'react-icons/md';
import { getInvoiceStats } from '../../services/InvoiceServices';
import styles from './FinanceStats.module.css';

const fmt = (n) => Number(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const CATEGORY_COLOR = {
    Marketing:   '#a855f7',
    Production:  '#ec4899',
    Development: '#22d3ee',
};

export default function FinanceStats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getInvoiceStats()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
        </div>
    );
    if (!stats) return null;

    const { totals, byCategory } = stats;
    const categories = ['Marketing', 'Production', 'Development'];

    const summaryCards = [
        {
            label: 'Total Revenue',
            sub: 'Paid invoices',
            value: fmt(totals.paid.amount),
            count: totals.paid.count,
            icon: <MdCheckCircle />,
            color: '#34d399',
            glow: 'rgba(52,211,153,0.18)',
        },
        {
            label: 'Pending',
            sub: 'Sent invoices',
            value: fmt(totals.pending.amount),
            count: totals.pending.count,
            icon: <MdSchedule />,
            color: '#60a5fa',
            glow: 'rgba(96,165,250,0.18)',
        },
        {
            label: 'Overdue',
            sub: 'Need attention',
            value: fmt(totals.overdue.amount),
            count: totals.overdue.count,
            icon: <MdWarning />,
            color: '#f87171',
            glow: 'rgba(248,113,113,0.18)',
        },
        {
            label: 'Drafts',
            sub: 'Not yet sent',
            value: fmt(totals.draft.amount),
            count: totals.draft.count,
            icon: <MdBarChart />,
            color: '#9ca3af',
            glow: 'rgba(156,163,175,0.12)',
        },
    ];

    return (
        <div className={styles.wrap}>
            {/* Summary cards */}
            <div className={styles.summaryGrid}>
                {summaryCards.map(card => (
                    <div key={card.label} className={styles.summaryCard} style={{ '--glow': card.glow, '--accent': card.color }}>
                        <div className={styles.cardIcon} style={{ background: card.glow, color: card.color }}>
                            {card.icon}
                        </div>
                        <div className={styles.cardBody}>
                            <span className={styles.cardLabel}>{card.label}</span>
                            <span className={styles.cardSub}>{card.sub}</span>
                            <span className={styles.cardValue} style={{ color: card.color }}>{card.value} TND</span>
                            <span className={styles.cardCount}>{card.count} invoice{card.count !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Category breakdown */}
            <div className={styles.categoryGrid}>
                {categories.map(cat => {
                    const catData = byCategory[cat] || {};
                    const paid    = catData['Paid']    || { amount: 0, count: 0 };
                    const pending = catData['Sent']    || { amount: 0, count: 0 };
                    const overdue = catData['Overdue'] || { amount: 0, count: 0 };
                    const total   = paid.amount + pending.amount + overdue.amount;
                    const paidPct = total > 0 ? Math.round((paid.amount / total) * 100) : 0;

                    return (
                        <div key={cat} className={styles.catCard}>
                            <div className={styles.catHeader}>
                                <span className={styles.catDot} style={{ background: CATEGORY_COLOR[cat] }} />
                                <span className={styles.catName}>{cat}</span>
                                <span className={styles.catTotal}>{fmt(total)} TND</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${paidPct}%`, background: CATEGORY_COLOR[cat] }}
                                />
                            </div>
                            <div className={styles.catStats}>
                                <span className={styles.catStat}>
                                    <span className={styles.catStatDot} style={{ background: '#34d399' }} />
                                    Paid: {fmt(paid.amount)}
                                </span>
                                <span className={styles.catStat}>
                                    <span className={styles.catStatDot} style={{ background: '#60a5fa' }} />
                                    Pending: {fmt(pending.amount)}
                                </span>
                                <span className={styles.catStat}>
                                    <span className={styles.catStatDot} style={{ background: '#f87171' }} />
                                    Overdue: {fmt(overdue.amount)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
