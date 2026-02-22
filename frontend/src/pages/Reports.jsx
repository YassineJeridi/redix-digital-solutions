import React, { useState, useEffect } from 'react';
import {
    MdFilterList, MdFileDownload, MdPictureAsPdf, MdRefresh,
    MdTrendingUp, MdPeople, MdAccountBalance, MdReceipt,
    MdBuild, MdGroup, MdAttachMoney
} from 'react-icons/md';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import * as ReportsService from '../services/ReportsServices';
import * as ClientsService from '../services/ClientsServices';
import styles from './Reports.module.css';

const COLORS = ['#c12de0', '#7817b6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const Reports = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [clients, setClients] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [filters, setFilters] = useState({
        startDate: '', endDate: '', clientId: '', serviceType: '', paymentStatus: ''
    });

    useEffect(() => {
        loadClients();
        loadReports();
    }, []);

    const loadClients = async () => {
        try {
            const data = await ClientsService.getClients();
            setClients(data);
        } catch (err) {
            console.error('Error loading clients:', err);
        }
    };

    const loadReports = async () => {
        try {
            setLoading(true);
            const data = await ReportsService.getReports(filters);
            setReportData(data);
        } catch (err) {
            console.error('Error loading reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            setExporting(true);
            await ReportsService.exportCSV(filters);
        } catch (err) {
            console.error('CSV export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            setExporting(true);
            await ReportsService.exportPDF(filters);
        } catch (err) {
            console.error('PDF export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <MdTrendingUp /> },
        { id: 'revenue', label: 'Revenue', icon: <MdAttachMoney /> },
        { id: 'clients', label: 'By Client', icon: <MdPeople /> },
        { id: 'profitability', label: 'Profitability', icon: <MdAccountBalance /> },
        { id: 'payments', label: 'Payments', icon: <MdReceipt /> },
        { id: 'tools', label: 'Tools', icon: <MdBuild /> },
        { id: 'team', label: 'Team', icon: <MdGroup /> },
    ];

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Generating reports...</p>
            </div>
        );
    }

    const summary = reportData?.summary || {};
    const revenueByPeriod = reportData?.revenueByPeriod || [];
    const revenueByClient = reportData?.revenueByClient || [];
    const profitability = reportData?.profitability || {};
    const payments = reportData?.payments || {};
    const toolsUsage = reportData?.toolsUsage || [];
    const teamPayouts = reportData?.teamPayouts || [];

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1 className={styles.title}>Reports</h1>
                <div className={styles.exportBtns}>
                    <button className={styles.csvBtn} onClick={handleExportCSV} disabled={exporting}>
                        <MdFileDownload /> CSV
                    </button>
                    <button className={styles.pdfBtn} onClick={handleExportPDF} disabled={exporting}>
                        <MdPictureAsPdf /> PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filtersBar}>
                <div className={styles.filterItem}>
                    <label>From</label>
                    <input type="date" value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)} />
                </div>
                <div className={styles.filterItem}>
                    <label>To</label>
                    <input type="date" value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)} />
                </div>
                <div className={styles.filterItem}>
                    <label>Client</label>
                    <select value={filters.clientId}
                        onChange={(e) => handleFilterChange('clientId', e.target.value)}>
                        <option value="">All Clients</option>
                        {clients.map(c => (
                            <option key={c._id} value={c._id}>{c.businessName}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.filterItem}>
                    <label>Service</label>
                    <select value={filters.serviceType}
                        onChange={(e) => handleFilterChange('serviceType', e.target.value)}>
                        <option value="">All Services</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Production">Production</option>
                        <option value="Development">Development</option>
                    </select>
                </div>
                <div className={styles.filterItem}>
                    <label>Payment</label>
                    <select value={filters.paymentStatus}
                        onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}>
                        <option value="">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Done">Done</option>
                    </select>
                </div>
                <button className={styles.applyBtn} onClick={loadReports}>
                    <MdRefresh /> Apply
                </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                    <>
                        <div className={styles.summaryGrid}>
                            <div className={styles.summaryCard}>
                                <span className={styles.sumLabel}>Total Projects</span>
                                <span className={styles.sumValue}>{summary.totalProjects || 0}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.sumLabel}>Total Revenue</span>
                                <span className={styles.sumValue}>{(summary.totalRevenue || 0).toLocaleString()} TND</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.sumLabel}>Average Project</span>
                                <span className={styles.sumValue}>{(summary.avgProjectValue || 0).toLocaleString()} TND</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.sumLabel}>Total Expenses</span>
                                <span className={styles.sumValue}>{(summary.totalExpenses || 0).toLocaleString()} TND</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.sumLabel}>Pending Amount</span>
                                <span className={styles.sumValue}>{(summary.pendingRevenue || 0).toLocaleString()} TND</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.sumLabel}>Paid Amount</span>
                                <span className={styles.sumValue}>{(summary.paidRevenue || 0).toLocaleString()} TND</span>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'revenue' && (
                    <div className={styles.chartCard}>
                        <h3>Revenue by Period</h3>
                        {revenueByPeriod.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={revenueByPeriod}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(v) => `${v.toLocaleString()} TND`}
                                        contentStyle={{ borderRadius: '10px' }} />
                                    <Bar dataKey="total" fill="#c12de0" radius={[6, 6, 0, 0]} name="Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className={styles.noData}>No revenue data for this period</p>
                        )}
                    </div>
                )}

                {activeTab === 'clients' && (
                    <div className={styles.chartCard}>
                        <h3>Revenue by Client</h3>
                        {revenueByClient.length > 0 ? (
                            <div className={styles.pieWrapper}>
                                <ResponsiveContainer width="100%" height={400}>
                                    <PieChart>
                                        <Pie data={revenueByClient} dataKey="total" nameKey="_id"
                                            cx="50%" cy="50%" outerRadius={150} label={({ _id, total }) => `${_id}: ${total.toLocaleString()} TND`}>
                                            {revenueByClient.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => `${v.toLocaleString()} TND`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className={styles.clientTable}>
                                    <table className={styles.table}>
                                        <thead><tr><th>Client</th><th>Projects</th><th>Revenue</th></tr></thead>
                                        <tbody>
                                            {revenueByClient.map((item, i) => (
                                                <tr key={i}>
                                                    <td><span className={styles.dot} style={{ background: COLORS[i % COLORS.length] }}></span>{item._id}</td>
                                                    <td>{item.count}</td>
                                                    <td className={styles.amount}>{item.total.toLocaleString()} TND</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <p className={styles.noData}>No client data available</p>
                        )}
                    </div>
                )}

                {activeTab === 'profitability' && (
                    <div className={styles.profitGrid}>
                        <div className={styles.profitCard}>
                            <h4>Gross Revenue</h4>
                            <span className={styles.profitValue}>{(profitability.totalRevenue || 0).toLocaleString()} TND</span>
                        </div>
                        <div className={styles.profitCard}>
                            <h4>Total Costs</h4>
                            <span className={styles.profitValue} style={{ color: '#ef4444' }}>
                                {(profitability.totalCosts || 0).toLocaleString()} TND
                            </span>
                        </div>
                        <div className={styles.profitCard}>
                            <h4>Net Profit</h4>
                            <span className={styles.profitValue} style={{ color: '#10b981' }}>
                                {(profitability.netProfit || 0).toLocaleString()} TND
                            </span>
                        </div>
                        <div className={styles.profitCard}>
                            <h4>Profit Margin</h4>
                            <span className={styles.profitValue} style={{ color: '#7817b6' }}>
                                {(profitability.profitMargin || 0).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className={styles.paymentsSection}>
                        <div className={styles.agingGrid}>
                            <div className={styles.agingCard}>
                                <h4>0-30 Days</h4>
                                <span className={styles.agingValue}>{(payments.aging0_30 || 0).toLocaleString()} TND</span>
                            </div>
                            <div className={styles.agingCard}>
                                <h4>31-60 Days</h4>
                                <span className={styles.agingValue} style={{ color: '#f59e0b' }}>
                                    {(payments.aging31_60 || 0).toLocaleString()} TND
                                </span>
                            </div>
                            <div className={styles.agingCard}>
                                <h4>61-90 Days</h4>
                                <span className={styles.agingValue} style={{ color: '#ef4444' }}>
                                    {(payments.aging61_90 || 0).toLocaleString()} TND
                                </span>
                            </div>
                            <div className={styles.agingCard}>
                                <h4>90+ Days</h4>
                                <span className={styles.agingValue} style={{ color: '#dc2626' }}>
                                    {(payments.aging90Plus || 0).toLocaleString()} TND
                                </span>
                            </div>
                        </div>
                        <div className={styles.paymentSummary}>
                            <p>Total Pending: <strong>{(payments.totalPending || 0).toLocaleString()} TND</strong></p>
                            <p>Total Paid: <strong>{(payments.totalPaid || 0).toLocaleString()} TND</strong></p>
                        </div>
                    </div>
                )}

                {activeTab === 'tools' && (
                    <div className={styles.toolsSection}>
                        {toolsUsage.length > 0 ? (
                            <div className={styles.toolsGrid}>
                                {toolsUsage.map((tool, i) => (
                                    <div key={i} className={styles.toolItem}>
                                        <div className={styles.toolInfo}>
                                            <h4>{tool._id}</h4>
                                            <span className={styles.toolPercent}>{(tool.percentage || 0).toFixed(1)}%</span>
                                        </div>
                                        <div className={styles.toolBar}>
                                            <div className={styles.toolBarFill}
                                                style={{ width: `${tool.percentage || 0}%`, background: COLORS[i % COLORS.length] }} />
                                        </div>
                                        <span className={styles.toolAmount}>{(tool.totalAllocated || 0).toLocaleString()} TND</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.noData}>No tools usage data</p>
                        )}
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className={styles.teamSection}>
                        {teamPayouts.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Projects</th>
                                        <th>Total Payout</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamPayouts.map((member, i) => (
                                        <tr key={i}>
                                            <td className={styles.memberName}>{member.memberName || member._id}</td>
                                            <td>{member.projectCount}</td>
                                            <td className={styles.amount}>{(member.totalPayout || 0).toLocaleString()} TND</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className={styles.noData}>No team payout data</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
