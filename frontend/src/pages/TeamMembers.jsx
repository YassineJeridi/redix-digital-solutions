import React, { useState, useEffect } from 'react';
import {
    MdAdd, MdEdit, MdDelete, MdSearch, MdPerson, MdPayment,
    MdAccountBalanceWallet, MdClose, MdFilterList, MdSavings,
    MdViewModule, MdViewList, MdCameraAlt, MdLock
} from 'react-icons/md';
import * as SettingsService from '../services/SettingsServices';
import * as ExpensesService from '../services/ExpensesServices';
import styles from './TeamMembers.module.css';

const TeamMembers = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [paymentData, setPaymentData] = useState({ amount: '', description: '', type: 'payment' });
    const [expandedMember, setExpandedMember] = useState(null);
    const [redixCaisseBalance, setRedixCaisseBalance] = useState(0);
    const [tipError, setTipError] = useState('');
    const [viewMode, setViewMode] = useState('table');

    // Passkey delete confirmation
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [deletePasskey, setDeletePasskey] = useState('');
    const [deletePasskeyError, setDeletePasskeyError] = useState('');
    const [deletePasskeyLoading, setDeletePasskeyLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '', role: '', email: '', status: 'active', password: '', profileImage: ''
    });

    useEffect(() => { fetchMembers(); }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const data = await SettingsService.getTeamMembers();
            setMembers(data);
        } catch (error) {
            console.error('Error fetching team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = { ...formData };
            // Don't send empty password on edit
            if (editingMember && !dataToSend.password) {
                delete dataToSend.password;
            }
            if (editingMember) {
                await SettingsService.updateTeamMember(editingMember._id, dataToSend);
            } else {
                await SettingsService.createTeamMember(dataToSend);
            }
            fetchMembers();
            resetForm();
        } catch (error) {
            console.error('Error saving member:', error);
        }
    };

    const handleDelete = (id) => {
        setPendingDeleteId(id);
        setDeletePasskey('');
        setDeletePasskeyError('');
    };

    const handleConfirmDelete = async (e) => {
        e.preventDefault();
        setDeletePasskeyError('');
        setDeletePasskeyLoading(true);
        try {
            const result = await SettingsService.verifyPasskey(deletePasskey);
            if (!result.valid) {
                setDeletePasskeyError('Invalid passkey.');
                setDeletePasskeyLoading(false);
                return;
            }
            await SettingsService.deleteTeamMember(pendingDeleteId);
            fetchMembers();
            setPendingDeleteId(null);
            setDeletePasskey('');
        } catch (error) {
            setDeletePasskeyError('Error deleting member.');
            console.error('Error deleting member:', error);
        } finally {
            setDeletePasskeyLoading(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setTipError('');
        const amount = Number(paymentData.amount);

        if (paymentData.type === 'payment') {
            if (amount > redixCaisseBalance) {
                setTipError(`Amount exceeds Redix Caisse balance (${redixCaisseBalance.toLocaleString()} TND)`);
                return;
            }
        }

        try {
            const data = { amount, description: paymentData.description };
            if (paymentData.type === 'payment') {
                await SettingsService.addPaymentToMember(showPaymentModal._id, data);
            } else {
                await SettingsService.addAdvanceToMember(showPaymentModal._id, data);
            }
            fetchMembers();
            setShowPaymentModal(null);
            setPaymentData({ amount: '', description: '', type: 'payment' });
            setTipError('');
        } catch (error) {
            console.error('Error processing payment:', error);
            setTipError(error.response?.data?.message || 'Error processing tip');
        }
    };

    const openTipModal = async (member) => {
        try {
            const summaryData = await ExpensesService.getFinancialSummary();
            setRedixCaisseBalance(summaryData.balance || 0);
        } catch (err) {
            console.error('Error fetching Redix Caisse balance:', err);
            setRedixCaisseBalance(0);
        }
        setTipError('');
        setPaymentData({ amount: '', description: '', type: 'payment' });
        setShowPaymentModal(member);
    };

    const handleEdit = (member) => {
        setEditingMember(member);
        setFormData({
            name: member.name, role: member.role, email: member.email,
            status: member.status, password: '', profileImage: member.profileImage || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingMember(null);
        setFormData({ name: '', role: '', email: '', status: 'active', password: '', profileImage: '' });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be less than 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, profileImage: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalReceived = members.reduce((sum, m) => sum + (m.totalReceived || 0), 0);
    const totalWithdrawn = members.reduce((sum, m) => sum + (m.totalWithdrawn || 0), 0);
    const totalCurrentBalance = members.reduce((sum, m) => sum + ((m.totalReceived || 0) - (m.totalWithdrawn || 0)), 0);
    const totalPending = members.reduce((sum, m) => sum + (m.pendingEarnings || 0), 0);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading team...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1 className={styles.title}>Team Members</h1>
                <div className={styles.headerActions}>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.viewBtnActive : ''}`}
                            onClick={() => setViewMode('cards')}
                            title="Card View"
                        >
                            <MdViewModule />
                        </button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
                            onClick={() => setViewMode('table')}
                            title="Table View"
                        >
                            <MdViewList />
                        </button>
                    </div>
                    <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                        <MdAdd /> Add Member
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <MdPerson className={styles.summaryIcon} />
                    <div>
                        <span className={styles.summaryLabel}>Total Members</span>
                        <span className={styles.summaryValue}>{members.length}</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <MdAccountBalanceWallet className={styles.summaryIcon} style={{ color: '#10b981' }} />
                    <div>
                        <span className={styles.summaryLabel}>Total Received</span>
                        <span className={styles.summaryValue}>{totalReceived.toLocaleString()} TND</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <MdPayment className={styles.summaryIcon} style={{ color: '#f59e0b' }} />
                    <div>
                        <span className={styles.summaryLabel}>Total Withdrawn</span>
                        <span className={styles.summaryValue}>{totalWithdrawn.toLocaleString()} TND</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <MdAccountBalanceWallet className={styles.summaryIcon} style={{ color: '#3b82f6' }} />
                    <div>
                        <span className={styles.summaryLabel}>Current Balance</span>
                        <span className={styles.summaryValue}>{totalCurrentBalance.toLocaleString()} TND</span>
                    </div>
                </div>
                {totalPending > 0 && (
                    <div className={styles.summaryCard}>
                        <MdAccountBalanceWallet className={styles.summaryIcon} style={{ color: '#a855f7' }} />
                        <div>
                            <span className={styles.summaryLabel}>Total Pending</span>
                            <span className={styles.summaryValue}>{totalPending.toLocaleString()} TND</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <MdSearch />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <MdFilterList />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Members */}
            {filteredMembers.length === 0 ? (
                <div className={styles.emptyState}>
                    <MdPerson size={48} />
                    <p>No team members found</p>
                </div>
            ) : viewMode === 'cards' ? (
                <div className={styles.membersGrid}>
                    {filteredMembers.map((member) => {
                        const balance = (member.totalReceived || 0) - (member.totalWithdrawn || 0);
                        return (
                            <div key={member._id} className={styles.memberCard}>
                                <div className={styles.cardTop}>
                                    <div className={styles.memberAvatar}>
                                        {member.profileImage ? (
                                            <img src={member.profileImage} alt={member.name} />
                                        ) : (
                                            <span>{member.name.charAt(0).toUpperCase()}</span>
                                        )}
                                        <span className={`${styles.statusDot} ${styles[`dot_${member.status}`]}`} />
                                    </div>
                                    <h3 className={styles.memberName}>{member.name}</h3>
                                    <span className={styles.memberRole}>{member.role}</span>
                                    <span className={styles.memberEmail}>{member.email}</span>
                                </div>

                                <div className={styles.financials}>
                                    <div className={styles.finItem}>
                                        <span className={styles.finLabel}>Received</span>
                                        <span className={styles.finValue} style={{ color: '#10b981' }}>
                                            {(member.totalReceived || 0).toLocaleString()} TND
                                        </span>
                                    </div>
                                    <div className={styles.finItem}>
                                        <span className={styles.finLabel}>Withdrawn</span>
                                        <span className={styles.finValue} style={{ color: '#f59e0b' }}>
                                            {(member.totalWithdrawn || 0).toLocaleString()} TND
                                        </span>
                                    </div>
                                    <div className={styles.finItem}>
                                        <span className={styles.finLabel}>Balance</span>
                                        <span className={styles.finValue} style={{ color: balance >= 0 ? '#3b82f6' : '#ef4444' }}>
                                            {balance.toLocaleString()} TND
                                        </span>
                                    </div>
                                </div>

                                {(member.pendingEarnings || 0) > 0 && (
                                    <div className={styles.pendingBar}>
                                        <span>Pending: {(member.pendingEarnings || 0).toLocaleString()} TND</span>
                                    </div>
                                )}

                                <div className={styles.memberActions}>
                                    <button className={styles.payBtn} onClick={() => openTipModal(member)}>
                                        <MdPayment /> Tip
                                    </button>
                                    <button className={styles.editBtn} onClick={() => handleEdit(member)}>
                                        <MdEdit />
                                    </button>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(member._id)}>
                                        <MdDelete />
                                    </button>
                                    <button
                                        className={styles.expandBtn}
                                        onClick={() => setExpandedMember(expandedMember === member._id ? null : member._id)}
                                    >
                                        {expandedMember === member._id ? 'Hide' : 'History'}
                                    </button>
                                </div>

                                {expandedMember === member._id && (
                                    <div className={styles.transactions}>
                                        <h4>Transaction History</h4>
                                        {member.transactions && member.transactions.length > 0 ? (
                                            <div className={styles.txList}>
                                                {member.transactions.slice(-10).reverse().map((tx, idx) => (
                                                    <div key={idx} className={styles.txItem}>
                                                        <span className={`${styles.txType} ${styles[`tx_${tx.type}`]}`}>
                                                            {tx.type === 'commission' ? 'tip' : tx.type}
                                                        </span>
                                                        <span className={styles.txDesc}>{tx.description}</span>
                                                        <span className={styles.txAmount}>
                                                            {['earning', 'tip', 'commission'].includes(tx.type) ? '+' : '-'}{tx.amount} TND
                                                        </span>
                                                        <span className={styles.txDate}>
                                                            {new Date(tx.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={styles.noTx}>No transactions yet</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Table View */
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Received</th>
                                <th>Withdrawn</th>
                                <th>Balance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((member) => {
                                const balance = (member.totalReceived || 0) - (member.totalWithdrawn || 0);
                                return (
                                    <tr key={member._id}>
                                        <td>
                                            <div className={styles.tableMember}>
                                                <div className={styles.tableAvatar}>
                                                    {member.profileImage ? (
                                                        <img src={member.profileImage} alt={member.name} />
                                                    ) : (
                                                        <span>{member.name.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <span className={styles.tableName}>{member.name}</span>
                                            </div>
                                        </td>
                                        <td>{member.role}</td>
                                        <td className={styles.emailCol}>{member.email}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[`status_${member.status}`]}`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td style={{ color: '#10b981', fontWeight: 600 }}>{(member.totalReceived || 0).toLocaleString()} TND</td>
                                        <td style={{ color: '#f59e0b', fontWeight: 600 }}>{(member.totalWithdrawn || 0).toLocaleString()} TND</td>
                                        <td style={{ color: balance >= 0 ? '#3b82f6' : '#ef4444', fontWeight: 700 }}>{balance.toLocaleString()} TND</td>
                                        <td>
                                            <div className={styles.tableActions}>
                                                <button className={styles.payBtn} onClick={() => openTipModal(member)} title="Tip">
                                                    <MdPayment />
                                                </button>
                                                <button className={styles.editBtn} onClick={() => handleEdit(member)} title="Edit">
                                                    <MdEdit />
                                                </button>
                                                <button className={styles.deleteBtn} onClick={() => handleDelete(member._id)} title="Delete">
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
            )}

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingMember ? 'Edit Member' : 'Add Team Member'}</h2>
                            <button className={styles.closeBtn} onClick={resetForm}><MdClose /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.avatarUpload}>
                                <div className={styles.avatarPreview}>
                                    {formData.profileImage ? (
                                        <img src={formData.profileImage} alt="Avatar" />
                                    ) : (
                                        <MdPerson />
                                    )}
                                </div>
                                <label className={styles.avatarBtn}>
                                    <MdCameraAlt /> {formData.profileImage ? 'Change Photo' : 'Upload Photo'}
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                                </label>
                                {formData.profileImage && (
                                    <button type="button" className={styles.removeAvatarBtn}
                                        onClick={() => setFormData(prev => ({ ...prev, profileImage: '' }))}>
                                        Remove
                                    </button>
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label>Full Name *</label>
                                <input type="text" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Role *</label>
                                    <input type="text" value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })} required
                                        placeholder="e.g., Designer, Developer" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email *</label>
                                    <input type="email" value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Status</label>
                                    <select value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>{editingMember ? 'New Password (leave empty to keep current)' : 'Login Password *'}</label>
                                <input type="password" value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingMember ? 'Leave empty to keep current password' : 'Min 6 characters'}
                                    minLength="6"
                                    required={!editingMember} />
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={resetForm}>Cancel</button>
                                <button type="submit" className={styles.submitBtn}>
                                    {editingMember ? 'Update' : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {pendingDeleteId && (
                <div className={styles.overlay}>
                    <div className={styles.modal} style={{ maxWidth: 400 }}>
                        <div className={styles.modalHeader}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MdLock style={{ color: '#c12de0' }} /> Confirm Delete
                            </h2>
                            <button className={styles.closeBtn} onClick={() => setPendingDeleteId(null)}><MdClose /></button>
                        </div>
                        <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 14 }}>
                            Enter the passkey to confirm removal of this team member. This action cannot be undone.
                        </p>
                        <form onSubmit={handleConfirmDelete} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Passkey *</label>
                                <input
                                    type="password"
                                    value={deletePasskey}
                                    onChange={(e) => setDeletePasskey(e.target.value)}
                                    placeholder="Enter passkey"
                                    autoFocus
                                    required
                                />
                            </div>
                            {deletePasskeyError && <div className={styles.errorBox}>{deletePasskeyError}</div>}
                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setPendingDeleteId(null)}>Cancel</button>
                                <button type="submit" className={styles.submitBtn}
                                    disabled={!deletePasskey || deletePasskeyLoading}
                                    style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)' }}
                                >
                                    {deletePasskeyLoading ? 'Verifying…' : 'Delete Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tip Modal */}
            {showPaymentModal && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Tip — {showPaymentModal.name}</h2>
                            <button className={styles.closeBtn} onClick={() => { setShowPaymentModal(null); setTipError(''); }}><MdClose /></button>
                        </div>
                        <form onSubmit={handlePayment} className={styles.form}>
                            <div className={styles.caisseInfo}>
                                <MdSavings style={{ color: '#10b981', fontSize: 22 }} />
                                <div>
                                    <span className={styles.caisseLabel}>Redix Caisse Balance</span>
                                    <span className={styles.caisseValue}>{redixCaisseBalance.toLocaleString()} TND</span>
                                </div>
                            </div>
                            {tipError && <div className={styles.errorBox}>{tipError}</div>}
                            <div className={styles.formGroup}>
                                <label>Amount (TND) *</label>
                                <input type="number" value={paymentData.amount} min="0" step="0.01"
                                    max={redixCaisseBalance}
                                    onChange={(e) => {
                                        setPaymentData({ ...paymentData, amount: e.target.value });
                                        if (Number(e.target.value) > redixCaisseBalance) {
                                            setTipError(`Cannot exceed Redix Caisse balance (${redixCaisseBalance.toLocaleString()} TND)`);
                                        } else {
                                            setTipError('');
                                        }
                                    }} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <input type="text" value={paymentData.description}
                                    onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                                    placeholder="e.g., Tip for great work" />
                            </div>
                            <div className={styles.paymentInfo}>
                                <p>Current Received: <strong>{(showPaymentModal.totalReceived || 0).toLocaleString()} TND</strong></p>
                                {paymentData.amount > 0 && (
                                    <p>After Tip: <strong style={{ color: '#10b981' }}>
                                        {((showPaymentModal.totalReceived || 0) + Number(paymentData.amount)).toLocaleString()} TND
                                    </strong></p>
                                )}
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => { setShowPaymentModal(null); setTipError(''); }}>Cancel</button>
                                <button type="submit" className={styles.submitBtn}
                                    disabled={!paymentData.amount || Number(paymentData.amount) <= 0 || Number(paymentData.amount) > redixCaisseBalance}>
                                    Send Tip
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamMembers;
