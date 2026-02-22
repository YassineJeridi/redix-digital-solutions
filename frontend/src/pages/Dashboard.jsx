import React, { useState, useEffect } from 'react';
import {
    MdTrendingUp, MdAccountBalance, MdPeople, MdBuild,
    MdSavings, MdReceipt, MdWork, MdCheckCircle,
    MdPending
} from 'react-icons/md';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import * as DashboardService from '../services/DashboardServices';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => { loadMetrics(); }, []);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            const data = await DashboardService.getDashboardStats();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to load dashboard metrics', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !metrics) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const statusColor = (status) => {
        switch (status) {
            case 'Done': case 'Completed': return '#10b981';
            case 'Pending': case 'In Progress': return '#f59e0b';
            case 'Not Started': return '#6b7280';
            default: return '#6b7280';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1 className={styles.title}>Dashboard Overview</h1>
            </div>

            {/* Key Metrics */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: 'rgba(193, 45, 224, 0.1)' }}>
                        <MdTrendingUp style={{ color: '#c12de0' }} />
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Total Revenue</span>
                        <span className={styles.metricValue}>{(metrics.totalRevenue || 0).toLocaleString()} TND</span>
                    </div>
                </div>
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                        <MdReceipt style={{ color: '#ef4444' }} />
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Total Expenses</span>
                        <span className={styles.metricValue}>{(metrics.totalExpenses || 0).toLocaleString()} TND</span>
                    </div>
                </div>
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        <MdAccountBalance style={{ color: '#10b981' }} />
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Net Profit</span>
                        <span className={styles.metricValue}>{(metrics.netProfit || 0).toLocaleString()} TND</span>
                    </div>
                </div>
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: 'rgba(120, 23, 182, 0.1)' }}>
                        <MdSavings style={{ color: '#7817b6' }} />
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Redix Caisse</span>
                        <span className={styles.metricValue}>{(metrics.redixCaisse || 0).toLocaleString()} TND</span>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                <div className={styles.statChip}>
                    <MdWork /> <strong>{metrics.totalServices || 0}</strong> Services
                </div>
                <div className={styles.statChip}>
                    <MdCheckCircle style={{ color: '#10b981' }} /> <strong>{metrics.completedServices || 0}</strong> Completed
                </div>
                <div className={styles.statChip}>
                    <MdPending style={{ color: '#f59e0b' }} /> <strong>{metrics.activeServices || 0}</strong> Active
                </div>
                <div className={styles.statChip}>
                    <MdReceipt style={{ color: '#ef4444' }} /> <strong>{metrics.pendingPayments || 0}</strong> Pending Payments
                </div>
                <div className={styles.statChip}>
                    <MdCheckCircle style={{ color: '#10b981' }} /> <strong>{metrics.donePayments || 0}</strong> Paid
                </div>
            </div>

            {/* Reserve Breakdown */}
            <div className={styles.reserveGrid}>
                <div className={styles.reserveCard}>
                    <div className={styles.reserveIcon}><MdBuild /></div>
                    <div>
                        <span className={styles.reserveLabel}>Tools Reserve</span>
                        <span className={styles.reserveValue}>{(metrics.toolsReserve || 0).toLocaleString()} TND</span>
                    </div>
                </div>
                <div className={styles.reserveCard}>
                    <div className={styles.reserveIcon}><MdPeople /></div>
                    <div>
                        <span className={styles.reserveLabel}>Team Share</span>
                        <span className={styles.reserveValue}>{(metrics.teamShare || 0).toLocaleString()} TND</span>
                    </div>
                </div>
            </div>

            {/* Revenue Charts Row */}
            <div className={styles.chartsRow}>
                {/* Department Totals - Donut Chart */}
                <div className={`${styles.chartCard} ${styles.chartHalf}`}>
                    <h3>Revenue by Department</h3>
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie
                                data={metrics.departmentTotals || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                            >
                                {(metrics.departmentTotals || []).map((entry, idx) => (
                                    <Cell key={idx} fill={['#8b5cf6', '#06b6d4', '#f97316'][idx]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value.toLocaleString()} TND`}
                                contentStyle={{ background: 'var(--card-bg, white)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '10px' }} />
                            <Legend
                                formatter={(value, entry) => {
                                    const item = (metrics.departmentTotals || []).find(d => d.name === value);
                                    return `${value}: ${item ? item.value.toLocaleString() : 0} TND`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Weekly Evolution - Line Chart */}
                <div className={`${styles.chartCard} ${styles.chartHalf}`}>
                    <h3>Weekly Evolution</h3>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={metrics.weeklyEvolution || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #f0f0f0)" />
                            <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--text-secondary, #6b7280)' }} />
                            <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary, #6b7280)' }} />
                            <Tooltip formatter={(value) => `${value.toLocaleString()} TND`}
                                contentStyle={{ background: 'var(--card-bg, white)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '10px' }} />
                            <Legend />
                            <Line type="monotone" dataKey="Marketing" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="Production" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="Development" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Services Table */}
            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <h3>Recent Services</h3>
                    <button className={styles.viewAllBtn} onClick={() => navigate('/services')}>View All</button>
                </div>
                {metrics.recentServices && metrics.recentServices.length > 0 ? (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>service</th>
                                    <th>Client</th>
                                    <th>Service</th>
                                    <th>Price</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.recentServices.map((service) => (
                                    <tr key={service._id}>
                                        <td className={styles.serviceName}>{service.projectName}</td>
                                        <td>{service.client?.businessName || 'N/A'}</td>
                                        <td><span className={styles.serviceBadge}>{service.serviceProvided || 'N/A'}</span></td>
                                        <td className={styles.budget}>{(service.totalPrice || 0).toLocaleString()} TND</td>
                                        <td>
                                            <span className={styles.statusBadge} style={{ background: `${statusColor(service.paymentStatus)}18`, color: statusColor(service.paymentStatus) }}>
                                                {service.paymentStatus || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.statusBadge} style={{ background: `${statusColor(service.projectStatus)}18`, color: statusColor(service.projectStatus) }}>
                                                {service.projectStatus || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.emptyState}><p>No Services yet. Create your first service to see data here.</p></div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;


