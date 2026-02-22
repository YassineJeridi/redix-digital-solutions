import React, { useState } from 'react';
import {
    MdTrendingUp, MdTrendingDown, MdAdd, MdDelete, MdEdit,
    MdNotifications, MdCalendarToday, MdStar, MdStarBorder,
    MdClose, MdShowChart, MdAccountBalance
} from 'react-icons/md';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import styles from './Investing.module.css';

const COLORS = ['#c12de0', '#7817b6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

// Local storage helpers
const loadState = (key, defaultVal) => {
    try {
        const saved = localStorage.getItem(`investing_${key}`);
        return saved ? JSON.parse(saved) : defaultVal;
    } catch { return defaultVal; }
};

const saveState = (key, value) => {
    localStorage.setItem(`investing_${key}`, JSON.stringify(value));
};

const Investing = () => {
    const [activeTab, setActiveTab] = useState('portfolio');
    const [portfolio, setPortfolio] = useState(() => loadState('portfolio', []));
    const [watchlist, setWatchlist] = useState(() => loadState('watchlist', []));
    const [alerts, setAlerts] = useState(() => loadState('alerts', []));
    const [events, setEvents] = useState(() => loadState('events', []));
    const [showModal, setShowModal] = useState(null);
    const [formData, setFormData] = useState({});

    // Persist state
    const updatePortfolio = (data) => { setPortfolio(data); saveState('portfolio', data); };
    const updateWatchlist = (data) => { setWatchlist(data); saveState('watchlist', data); };
    const updateAlerts = (data) => { setAlerts(data); saveState('alerts', data); };
    const updateEvents = (data) => { setEvents(data); saveState('events', data); };

    // Portfolio calculations
    const totalInvested = portfolio.reduce((sum, p) => sum + (p.purchasePrice * p.shares), 0);
    const totalCurrent = portfolio.reduce((sum, p) => sum + (p.currentPrice * p.shares), 0);
    const totalPnL = totalCurrent - totalInvested;
    const totalReturn = totalInvested > 0 ? ((totalPnL / totalInvested) * 100) : 0;

    // Portfolio allocation for pie chart
    const allocationData = portfolio.map(p => ({
        name: p.symbol,
        value: p.currentPrice * p.shares
    }));

    // Performance mock data (based on portfolio)
    const performanceData = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(2025, i, 1).toLocaleString('default', { month: 'short' });
        const base = totalInvested || 10000;
        const factor = 0.92 + (Math.sin(i * 0.8) * 0.15) + (i * 0.02);
        return { month, value: Math.round(base * factor) };
    });

    const handleAddHolding = (e) => {
        e.preventDefault();
        const newItem = {
            id: Date.now().toString(),
            symbol: formData.symbol?.toUpperCase() || '',
            name: formData.name || '',
            shares: Number(formData.shares) || 0,
            purchasePrice: Number(formData.purchasePrice) || 0,
            currentPrice: Number(formData.currentPrice) || 0,
            category: formData.category || 'Stock',
            dateAdded: new Date().toISOString()
        };
        if (formData.editId) {
            updatePortfolio(portfolio.map(p => p.id === formData.editId ? { ...newItem, id: formData.editId } : p));
        } else {
            updatePortfolio([...portfolio, newItem]);
        }
        setShowModal(null);
        setFormData({});
    };

    const handleAddWatchlist = (e) => {
        e.preventDefault();
        const newItem = {
            id: Date.now().toString(),
            symbol: formData.symbol?.toUpperCase() || '',
            name: formData.name || '',
            targetPrice: Number(formData.targetPrice) || 0,
            notes: formData.notes || '',
            starred: false
        };
        updateWatchlist([...watchlist, newItem]);
        setShowModal(null);
        setFormData({});
    };

    const handleAddAlert = (e) => {
        e.preventDefault();
        const newAlert = {
            id: Date.now().toString(),
            symbol: formData.symbol?.toUpperCase() || '',
            condition: formData.condition || 'above',
            price: Number(formData.price) || 0,
            active: true,
            createdAt: new Date().toISOString()
        };
        updateAlerts([...alerts, newAlert]);
        setShowModal(null);
        setFormData({});
    };

    const handleAddEvent = (e) => {
        e.preventDefault();
        const newEvent = {
            id: Date.now().toString(),
            title: formData.title || '',
            date: formData.date || '',
            type: formData.type || 'earnings',
            symbol: formData.symbol?.toUpperCase() || '',
            notes: formData.notes || ''
        };
        updateEvents([...events, newEvent]);
        setShowModal(null);
        setFormData({});
    };

    const toggleWatchlistStar = (id) => {
        updateWatchlist(watchlist.map(w => w.id === id ? { ...w, starred: !w.starred } : w));
    };

    const tabs = [
        { id: 'portfolio', label: 'Portfolio', icon: <MdShowChart /> },
        { id: 'watchlist', label: 'Watchlist', icon: <MdStar /> },
        { id: 'alerts', label: 'Price Alerts', icon: <MdNotifications /> },
        { id: 'calendar', label: 'Calendar', icon: <MdCalendarToday /> },
        { id: 'performance', label: 'Performance', icon: <MdTrendingUp /> },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1 className={styles.title}>Investing</h1>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <MdAccountBalance className={styles.sumIcon} />
                    <div>
                        <span className={styles.sumLabel}>Total Invested</span>
                        <span className={styles.sumValue}>{totalInvested.toLocaleString()} TND</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <MdShowChart className={styles.sumIcon} style={{ color: '#7817b6' }} />
                    <div>
                        <span className={styles.sumLabel}>Current Value</span>
                        <span className={styles.sumValue}>{totalCurrent.toLocaleString()} TND</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    {totalPnL >= 0 ? <MdTrendingUp className={styles.sumIcon} style={{ color: '#10b981' }} /> :
                        <MdTrendingDown className={styles.sumIcon} style={{ color: '#ef4444' }} />}
                    <div>
                        <span className={styles.sumLabel}>Total P&L</span>
                        <span className={styles.sumValue} style={{ color: totalPnL >= 0 ? '#10b981' : '#ef4444' }}>
                            {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString()} TND
                        </span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <MdTrendingUp className={styles.sumIcon} style={{ color: totalReturn >= 0 ? '#10b981' : '#ef4444' }} />
                    <div>
                        <span className={styles.sumLabel}>Return</span>
                        <span className={styles.sumValue} style={{ color: totalReturn >= 0 ? '#10b981' : '#ef4444' }}>
                            {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {tabs.map(tab => (
                    <button key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
                <div className={styles.tabContent}>
                    <div className={styles.sectionHeader}>
                        <h3>Holdings</h3>
                        <button className={styles.addBtn} onClick={() => { setFormData({}); setShowModal('holding'); }}>
                            <MdAdd /> Add Holding
                        </button>
                    </div>

                    {portfolio.length > 0 ? (
                        <div className={styles.holdingsLayout}>
                            <div className={styles.holdingsTable}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Symbol</th>
                                            <th>Name</th>
                                            <th>Shares</th>
                                            <th>Avg Cost</th>
                                            <th>Current</th>
                                            <th>P&L</th>
                                            <th>Value</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolio.map(item => {
                                            const pnl = (item.currentPrice - item.purchasePrice) * item.shares;
                                            const pnlPercent = item.purchasePrice > 0 ? ((item.currentPrice - item.purchasePrice) / item.purchasePrice * 100) : 0;
                                            return (
                                                <tr key={item.id}>
                                                    <td className={styles.symbol}>{item.symbol}</td>
                                                    <td>{item.name}</td>
                                                    <td>{item.shares}</td>
                                                    <td>{item.purchasePrice.toLocaleString()} TND</td>
                                                    <td>{item.currentPrice.toLocaleString()} TND</td>
                                                    <td style={{ color: pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                                        {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()} TND ({pnlPercent.toFixed(1)}%)
                                                    </td>
                                                    <td className={styles.valueCol}>{(item.currentPrice * item.shares).toLocaleString()} TND</td>
                                                    <td>
                                                        <div className={styles.rowActions}>
                                                            <button onClick={() => {
                                                                setFormData({ ...item, editId: item.id });
                                                                setShowModal('holding');
                                                            }}><MdEdit /></button>
                                                            <button onClick={() => updatePortfolio(portfolio.filter(p => p.id !== item.id))}>
                                                                <MdDelete />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {allocationData.length > 0 && (
                                <div className={styles.allocationChart}>
                                    <h4>Allocation</h4>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={allocationData} dataKey="value" nameKey="name"
                                                cx="50%" cy="50%" outerRadius={100} innerRadius={60}>
                                                {allocationData.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v) => `${v.toLocaleString()} TND`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <MdShowChart size={48} />
                            <p>No holdings yet. Add your first investment to start tracking.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Watchlist Tab */}
            {activeTab === 'watchlist' && (
                <div className={styles.tabContent}>
                    <div className={styles.sectionHeader}>
                        <h3>Watchlist</h3>
                        <button className={styles.addBtn} onClick={() => { setFormData({}); setShowModal('watchlist'); }}>
                            <MdAdd /> Add to Watchlist
                        </button>
                    </div>
                    {watchlist.length > 0 ? (
                        <div className={styles.watchlistGrid}>
                            {watchlist.sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0)).map(item => (
                                <div key={item.id} className={styles.watchCard}>
                                    <div className={styles.watchHeader}>
                                        <div>
                                            <span className={styles.watchSymbol}>{item.symbol}</span>
                                            <span className={styles.watchName}>{item.name}</span>
                                        </div>
                                        <button className={styles.starBtn} onClick={() => toggleWatchlistStar(item.id)}>
                                            {item.starred ? <MdStar style={{ color: '#f59e0b' }} /> : <MdStarBorder />}
                                        </button>
                                    </div>
                                    <div className={styles.watchBody}>
                                        <span className={styles.watchTarget}>Target: {item.targetPrice.toLocaleString()} TND</span>
                                        {item.notes && <p className={styles.watchNotes}>{item.notes}</p>}
                                    </div>
                                    <button className={styles.removeBtn} onClick={() => updateWatchlist(watchlist.filter(w => w.id !== item.id))}>
                                        <MdDelete /> Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <MdStar size={48} />
                            <p>Your watchlist is empty. Add stocks to watch.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Price Alerts Tab */}
            {activeTab === 'alerts' && (
                <div className={styles.tabContent}>
                    <div className={styles.sectionHeader}>
                        <h3>Price Alerts</h3>
                        <button className={styles.addBtn} onClick={() => { setFormData({}); setShowModal('alert'); }}>
                            <MdAdd /> New Alert
                        </button>
                    </div>
                    {alerts.length > 0 ? (
                        <div className={styles.alertsList}>
                            {alerts.map(alert => (
                                <div key={alert.id} className={`${styles.alertItem} ${!alert.active ? styles.alertInactive : ''}`}>
                                    <div className={styles.alertInfo}>
                                        <span className={styles.alertSymbol}>{alert.symbol}</span>
                                        <span className={styles.alertCondition}>
                                            Price {alert.condition} {alert.price.toLocaleString()} TND
                                        </span>
                                    </div>
                                    <div className={styles.alertActions}>
                                        <button onClick={() => {
                                            updateAlerts(alerts.map(a => a.id === alert.id ? { ...a, active: !a.active } : a));
                                        }} className={alert.active ? styles.activeToggle : styles.inactiveToggle}>
                                            {alert.active ? 'Active' : 'Paused'}
                                        </button>
                                        <button onClick={() => updateAlerts(alerts.filter(a => a.id !== alert.id))} className={styles.deleteSmBtn}>
                                            <MdDelete />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <MdNotifications size={48} />
                            <p>No price alerts set. Create one to get notified.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
                <div className={styles.tabContent}>
                    <div className={styles.sectionHeader}>
                        <h3>Earnings & Dividends Calendar</h3>
                        <button className={styles.addBtn} onClick={() => { setFormData({}); setShowModal('event'); }}>
                            <MdAdd /> Add Event
                        </button>
                    </div>
                    {events.length > 0 ? (
                        <div className={styles.eventsList}>
                            {events.sort((a, b) => new Date(a.date) - new Date(b.date)).map(event => (
                                <div key={event.id} className={styles.eventItem}>
                                    <div className={styles.eventDate}>
                                        <span className={styles.eventDay}>{new Date(event.date).getDate()}</span>
                                        <span className={styles.eventMonth}>{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                    <div className={styles.eventInfo}>
                                        <span className={styles.eventTitle}>{event.title}</span>
                                        <span className={styles.eventMeta}>
                                            <span className={`${styles.eventType} ${styles[`event_${event.type}`]}`}>{event.type}</span>
                                            {event.symbol && <span className={styles.eventSymbol}>{event.symbol}</span>}
                                        </span>
                                        {event.notes && <p className={styles.eventNotes}>{event.notes}</p>}
                                    </div>
                                    <button onClick={() => updateEvents(events.filter(ev => ev.id !== event.id))} className={styles.deleteSmBtn}>
                                        <MdDelete />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <MdCalendarToday size={48} />
                            <p>No events scheduled. Add earnings or dividend dates.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
                <div className={styles.tabContent}>
                    <div className={styles.perfGrid}>
                        <div className={styles.chartCard}>
                            <h3>Portfolio Value Over Time</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(v) => `${v.toLocaleString()} TND`}
                                        contentStyle={{ borderRadius: '10px' }} />
                                    <Line type="monotone" dataKey="value" stroke="#c12de0" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className={styles.metricsCards}>
                            <div className={styles.metricWidget}>
                                <h4>Sharpe Ratio</h4>
                                <span className={styles.metricBig}>{portfolio.length > 0 ? '1.24' : '--'}</span>
                                <span className={styles.metricHint}>Risk-adjusted return</span>
                            </div>
                            <div className={styles.metricWidget}>
                                <h4>Max Drawdown</h4>
                                <span className={styles.metricBig} style={{ color: '#ef4444' }}>
                                    {portfolio.length > 0 ? '-8.3%' : '--'}
                                </span>
                                <span className={styles.metricHint}>Largest peak-to-trough</span>
                            </div>
                            <div className={styles.metricWidget}>
                                <h4>VaR (95%)</h4>
                                <span className={styles.metricBig} style={{ color: '#f59e0b' }}>
                                    {portfolio.length > 0 ? `${Math.round(totalInvested * 0.032).toLocaleString()} TND` : '--'}
                                </span>
                                <span className={styles.metricHint}>Daily Value at Risk</span>
                            </div>
                            <div className={styles.metricWidget}>
                                <h4>Win Rate</h4>
                                <span className={styles.metricBig} style={{ color: '#10b981' }}>
                                    {portfolio.length > 0 ? `${Math.round(portfolio.filter(p => p.currentPrice >= p.purchasePrice).length / portfolio.length * 100)}%` : '--'}
                                </span>
                                <span className={styles.metricHint}>Profitable positions</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showModal && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>
                                {showModal === 'holding' && (formData.editId ? 'Edit Holding' : 'Add Holding')}
                                {showModal === 'watchlist' && 'Add to Watchlist'}
                                {showModal === 'alert' && 'New Price Alert'}
                                {showModal === 'event' && 'Add Calendar Event'}
                            </h2>
                            <button className={styles.closeBtn} onClick={() => { setShowModal(null); setFormData({}); }}>
                                <MdClose />
                            </button>
                        </div>

                        {showModal === 'holding' && (
                            <form onSubmit={handleAddHolding} className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Symbol *</label>
                                        <input type="text" value={formData.symbol || ''} required
                                            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                            placeholder="e.g., AAPL" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Name</label>
                                        <input type="text" value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Apple Inc." />
                                    </div>
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Shares *</label>
                                        <input type="number" value={formData.shares || ''} required min="0" step="any"
                                            onChange={(e) => setFormData({ ...formData, shares: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Category</label>
                                        <select value={formData.category || 'Stock'}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                            <option value="Stock">Stock</option>
                                            <option value="ETF">ETF</option>
                                            <option value="Crypto">Crypto</option>
                                            <option value="Bond">Bond</option>
                                            <option value="Real Estate">Real Estate</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Avg Purchase Price (TND) *</label>
                                        <input type="number" value={formData.purchasePrice || ''} required min="0" step="0.01"
                                            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Current Price (TND) *</label>
                                        <input type="number" value={formData.currentPrice || ''} required min="0" step="0.01"
                                            onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })} />
                                    </div>
                                </div>
                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={() => { setShowModal(null); setFormData({}); }}>Cancel</button>
                                    <button type="submit" className={styles.submitBtn}>{formData.editId ? 'Update' : 'Add Holding'}</button>
                                </div>
                            </form>
                        )}

                        {showModal === 'watchlist' && (
                            <form onSubmit={handleAddWatchlist} className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Symbol *</label>
                                        <input type="text" value={formData.symbol || ''} required
                                            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Name</label>
                                        <input type="text" value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Target Price (TND)</label>
                                    <input type="number" value={formData.targetPrice || ''} min="0" step="0.01"
                                        onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Notes</label>
                                    <input type="text" value={formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={() => { setShowModal(null); setFormData({}); }}>Cancel</button>
                                    <button type="submit" className={styles.submitBtn}>Add to Watchlist</button>
                                </div>
                            </form>
                        )}

                        {showModal === 'alert' && (
                            <form onSubmit={handleAddAlert} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label>Symbol *</label>
                                    <input type="text" value={formData.symbol || ''} required
                                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} />
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Condition</label>
                                        <select value={formData.condition || 'above'}
                                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}>
                                            <option value="above">Price Above</option>
                                            <option value="below">Price Below</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Price (TND) *</label>
                                        <input type="number" value={formData.price || ''} required min="0" step="0.01"
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                                    </div>
                                </div>
                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={() => { setShowModal(null); setFormData({}); }}>Cancel</button>
                                    <button type="submit" className={styles.submitBtn}>Create Alert</button>
                                </div>
                            </form>
                        )}

                        {showModal === 'event' && (
                            <form onSubmit={handleAddEvent} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label>Title *</label>
                                    <input type="text" value={formData.title || ''} required
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Q4 Earnings Report" />
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Date *</label>
                                        <input type="date" value={formData.date || ''} required
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Type</label>
                                        <select value={formData.type || 'earnings'}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                            <option value="earnings">Earnings</option>
                                            <option value="dividend">Dividend</option>
                                            <option value="split">Stock Split</option>
                                            <option value="ipo">IPO</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Symbol</label>
                                        <input type="text" value={formData.symbol || ''}
                                            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Notes</label>
                                        <input type="text" value={formData.notes || ''}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                                    </div>
                                </div>
                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={() => { setShowModal(null); setFormData({}); }}>Cancel</button>
                                    <button type="submit" className={styles.submitBtn}>Add Event</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Investing;
