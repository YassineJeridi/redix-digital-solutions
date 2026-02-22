import React, { useState, useEffect } from 'react';
import {
    MdTrendingUp,
    MdAccountBalance,
    MdPeople,
    MdBuild,
    MdSavings
} from 'react-icons/md';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import * as DashboardService from '../../services/DashboardServices';
import styles from './DashboardOverview.module.css';

const DashboardOverview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await DashboardService.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            {/* Financial Metrics Cards */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        <MdTrendingUp style={{ color: 'var(--success-color)' }} />
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Total Revenue</span>
                        <span className={styles.metricValue}>{stats?.totalRevenue?.toFixed(2) || '0.00'} TND</span>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                        <MdTrendingUp style={{ color: 'var(--danger-color)', transform: 'rotate(180deg)' }} />
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Total Expenses</span>
                        <span className={styles.metricValue}>{stats?.totalExpenses?.toFixed(2) || '0.00'} TND</span>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                        <MdAccountBalance style={{ color: 'var(--primary-color)' }} />
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Net Profit</span>
                        <span className={styles.metricValue}>{stats?.netProfit?.toFixed(2) || '0.00'} TND</span>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                        <MdSavings style={{ color: 'var(--warning-color)' }} />
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Redix Caisse</span>
                        <span className={styles.metricValue}>{stats?.redixCaisse?.toFixed(2) || '0.00'} TND</span>
                    </div>
                </div>
            </div>

            {/* Reserve Breakdown */}
            <div className={styles.reserveGrid}>
                <div className={styles.reserveCard}>
                    <MdBuild className={styles.reserveIcon} />
                    <div>
                        <span className={styles.reserveLabel}>Tools Reserve</span>
                        <span className={styles.reserveValue}>{stats?.toolsReserve?.toFixed(2) || '0.00'} TND</span>
                    </div>
                </div>

                <div className={styles.reserveCard}>
                    <MdPeople className={styles.reserveIcon} />
                    <div>
                        <span className={styles.reserveLabel}>Team Share</span>
                        <span className={styles.reserveValue}>{stats?.teamShare?.toFixed(2) || '0.00'} TND</span>
                    </div>
                </div>

                <div className={styles.reserveCard}>
                    <MdSavings className={styles.reserveIcon} />
                    <div>
                        <span className={styles.reserveLabel}>Investment Reserve</span>
                        <span className={styles.reserveValue}>{stats?.investmentReserve?.toFixed(2) || '0.00'} TND</span>
                    </div>
                </div>
            </div>

            {/* Revenue by Department Chart */}
            <div className={styles.chartCard}>
                <h3>Revenue by Department</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={stats?.revenueByDepartment || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis label={{ value: 'Revenue (TND)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                            formatter={(value) => `${value.toFixed(2)} TND`}
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="Marketing"
                            stroke="#6366F1"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            activeDot={{ r: 8 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="Production"
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            activeDot={{ r: 8 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="Development"
                            stroke="#F59E0B"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Service Stats */}
            <div className={styles.serviceStats}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Active Services</span>
                    <span className={styles.statValue}>{stats?.activeServices || 0}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Completed Services</span>
                    <span className={styles.statValue}>{stats?.completedServices || 0}</span>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;

