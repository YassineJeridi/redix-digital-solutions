import React, { useState, useEffect } from 'react';
import {
    MdAdd,
    MdDelete,
    MdEdit,
    MdAccountBalance,
    MdReceipt,
    MdSavings,
    MdTrendingUp,
    MdAddCircle
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
import * as ExpensesService from '../services/ExpensesServices';
import styles from './Expenses.module.css';

const Expenses = () => {
    const [summary, setSummary] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Tools',
        date: new Date().toISOString().split('T')[0]
    });
    const [error, setError] = useState('');
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositData, setDepositData] = useState({ amount: '', description: '' });
    const [depositError, setDepositError] = useState('');
    const [chartPeriod, setChartPeriod] = useState('month');

    const categories = ['Tools', 'Salaries', 'Office', 'Marketing', 'Utilities', 'Other'];

    useEffect(() => { loadData(); }, []);
    useEffect(() => { if (!loading) loadSummary(); }, [chartPeriod]);

    const loadSummary = async () => {
        try {
            const summaryData = await ExpensesService.getFinancialSummary(chartPeriod);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [summaryData, expensesData] = await Promise.all([
                ExpensesService.getFinancialSummary(chartPeriod),
                ExpensesService.getExpenses()
            ]);
            setSummary(summaryData);
            setExpenses(expensesData.expenses);
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingExpense) {
                await ExpensesService.updateExpense(editingExpense._id, formData);
            } else {
                await ExpensesService.createExpense(formData);
            }
            
            setFormData({
                description: '',
                amount: '',
                category: 'Tools',
                date: new Date().toISOString().split('T')[0]
            });
            setShowForm(false);
            setEditingExpense(null);
            loadData();
        } catch (error) {
            console.error('Error saving expense:', error);
            setError(error.response?.data?.message || 'Failed to save expense');
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: new Date(expense.date).toISOString().split('T')[0]
        });
        setShowForm(true);
        setError('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        
        try {
            await ExpensesService.deleteExpense(id);
            loadData();
        } catch (error) {
            console.error('Error deleting expense:', error);
            setError('Failed to delete expense');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingExpense(null);
        setFormData({
            description: '',
            amount: '',
            category: 'Tools',
            date: new Date().toISOString().split('T')[0]
        });
        setError('');
    };

    const handleDepositSubmit = async (e) => {
        e.preventDefault();
        setDepositError('');

        const amount = parseFloat(depositData.amount);
        if (!amount || amount <= 0) {
            setDepositError('Amount must be greater than 0');
            return;
        }

        try {
            await ExpensesService.addManualDeposit(amount, depositData.description);
            setShowDepositModal(false);
            setDepositData({ amount: '', description: '' });
            loadData();
        } catch (error) {
            console.error('Error adding deposit:', error);
            setDepositError(error.response?.data?.message || 'Failed to add deposit');
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading...</p>
            </div>
        );
    }
    if (!summary) {
        return (
            <div className={styles.loadingContainer}>
                <p>No data available</p>
            </div>
        );
    }
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Financial Management</h1>
                {!showForm && (
                    <div className={styles.headerActions}>
                        <button 
                            className={styles.depositBtn}
                            onClick={() => setShowDepositModal(true)}
                        >
                            <MdAddCircle /> Add Money to Caisse
                        </button>
                        <button 
                            className={styles.addBtn}
                            onClick={() => setShowForm(true)}
                        >
                            <MdAdd /> Add Expense
                        </button>
                    </div>
                )}
            </div>

            {/* Financial Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard} style={{ borderColor: '#10b981' }}>
                    <div className={styles.cardIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        <MdSavings style={{ color: '#10b981' }} />
                    </div>
                    <div className={styles.cardContent}>
                        <span className={styles.cardLabel}>Redix Caisse</span>
                        <span className={styles.cardValue}>{summary.totalRedixCaisse.toFixed(2)} TND</span>
                    </div>
                </div>

                <div className={styles.summaryCard} style={{ borderColor: '#ef4444' }}>
                    <div className={styles.cardIcon} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                        <MdReceipt style={{ color: '#ef4444' }} />
                    </div>
                    <div className={styles.cardContent}>
                        <span className={styles.cardLabel}>Total Expenses</span>
                        <span className={styles.cardValue}>{summary.totalExpenses.toFixed(2)} TND</span>
                    </div>
                </div>

            </div>

            {/* Evolution Chart */}
            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <h3>Financial Evolution</h3>
                    <div className={styles.periodFilters}>
                        {[{ key: 'day', label: 'Day' }, { key: 'week', label: 'Week' }, { key: 'month', label: 'Month' }, { key: '3months', label: '3 Months' }, { key: '1year', label: '1 Year' }].map(p => (
                            <button
                                key={p.key}
                                className={`${styles.periodBtn} ${chartPeriod === p.key ? styles.periodBtnActive : ''}`}
                                onClick={() => setChartPeriod(p.key)}
                            >{p.label}</button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={summary.chartData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis label={{ value: 'Amount (TND)', angle: -90, position: 'insideLeft' }} />
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
                            dataKey="redixCaisse"
                            stroke="#10b981"
                            strokeWidth={3}
                            name="Redix Caisse"
                            dot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="expenses"
                            stroke="#ef4444"
                            strokeWidth={3}
                            name="Expenses"
                            dot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="balance"
                            stroke="#6366f1"
                            strokeWidth={3}
                            name="Balance"
                            dot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Add/Edit Form - Modal Overlay */}
            {showForm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.formCard}>
                        <h3>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h3>
                    {error && <div className={styles.errorBox}>{error}</div>}
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Description *</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    placeholder="Enter expense description"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Amount (TND) *</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Category *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Date *</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
                                Cancel
                            </button>
                            <button type="submit" className={styles.submitBtn}>
                                {editingExpense ? 'Update' : 'Add'} Expense
                            </button>
                        </div>
                    </form>
                    </div>
                </div>
            )}

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.formCard}>
                        <h3>Add Money to Redix Caisse</h3>
                        {depositError && <div className={styles.errorBox}>{depositError}</div>}
                        <form onSubmit={handleDepositSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Amount (TND) *</label>
                                <input
                                    type="number"
                                    value={depositData.amount}
                                    onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                                    required
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={depositData.description}
                                    onChange={(e) => setDepositData({ ...depositData, description: e.target.value })}
                                    placeholder="e.g. Client payment, external income..."
                                />
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => { setShowDepositModal(false); setDepositData({ amount: '', description: '' }); setDepositError(''); }}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.depositSubmitBtn}>
                                    <MdAddCircle /> Add Deposit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tables Row */}
            <div className={styles.tablesRow}>
                {/* Expenses History */}
                <div className={styles.tableCard}>
                    <h3>Expenses History</h3>
                    {expenses.length > 0 ? (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense._id}>
                                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                                        <td>{expense.description}</td>
                                        <td><span className={styles.categoryBadge}>{expense.category}</span></td>
                                        <td className={styles.amount}>{expense.amount.toFixed(2)} TND</td>
                                        <td className={styles.actions}>
                                            <button className={styles.editBtn} onClick={() => handleEdit(expense)} title="Edit"><MdEdit /></button>
                                            <button className={styles.deleteBtn} onClick={() => handleDelete(expense._id)} title="Delete"><MdDelete /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className={styles.emptyState}>
                            <MdReceipt />
                            <p>No expenses recorded yet</p>
                        </div>
                    )}
                </div>

                {/* Redix Caisse History */}
                <div className={styles.tableCard}>
                    <h3>Redix Caisse History</h3>
                    {summary.depositHistory && summary.depositHistory.length > 0 ? (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.depositHistory.map((dep, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(dep.date).toLocaleDateString()}</td>
                                        <td>{dep.description}</td>
                                        <td className={styles.depositAmount}>+{dep.amount.toFixed(2)} TND</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className={styles.emptyState}>
                            <MdSavings />
                            <p>No deposits yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Expenses;
