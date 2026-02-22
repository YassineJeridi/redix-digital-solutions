import React, { useState, useEffect } from 'react';
import { MdAdd, MdPerson, MdEdit, MdDelete, MdAccountBalance, MdEmail, MdPayment, MdPhone, MdMoneyOff } from 'react-icons/md';
import TeamMemberForm from './TeamMemberForm';
import * as SettingsService from '../../services/SettingsServices';
import styles from './TeamMembersList.module.css';

const TeamMembersList = () => {
    const [members, setMembers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [commissionModal, setCommissionModal] = useState(null);
    const [commissionData, setCommissionData] = useState({ amount: '', description: '' });
    const [withdrawalModal, setWithdrawalModal] = useState(null);
    const [withdrawalData, setWithdrawalData] = useState({ amount: '', description: '' });

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const data = await SettingsService.getTeamMembers();
            setMembers(data);
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    const handleAddMember = async (memberData) => {
        try {
            await SettingsService.createTeamMember(memberData);
            fetchMembers();
            setShowForm(false);
        } catch (error) {
            console.error('Error creating member:', error);
        }
    };

    const handleUpdateMember = async (memberData) => {
        try {
            await SettingsService.updateTeamMember(editingMember._id, memberData);
            fetchMembers();
            setEditingMember(null);
            setShowForm(false);
        } catch (error) {
            console.error('Error updating member:', error);
        }
    };

    const handleDeleteMember = async (memberId) => {
        if (window.confirm('Are you sure you want to delete this team member?')) {
            try {
                await SettingsService.deleteTeamMember(memberId);
                fetchMembers();
            } catch (error) {
                console.error('Error deleting member:', error);
            }
        }
    };

    const handleEditClick = (member) => {
        setEditingMember(member);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingMember(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'inactive': return '#6b7280';
            case 'suspended': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const handleCommissionSubmit = async () => {
        if (!commissionData.amount || Number(commissionData.amount) <= 0) return;
        try {
            await SettingsService.addPaymentToMember(commissionModal._id, {
                amount: Number(commissionData.amount),
                description: commissionData.description || 'Commission payment'
            });
            fetchMembers();
            setCommissionModal(null);
            setCommissionData({ amount: '', description: '' });
        } catch (error) {
            console.error('Error adding commission:', error);
        }
    };

    const handleWithdrawalSubmit = async () => {
        if (!withdrawalData.amount || Number(withdrawalData.amount) <= 0) return;
        try {
            await SettingsService.addWithdrawalToMember(withdrawalModal._id, {
                amount: Number(withdrawalData.amount),
                description: withdrawalData.description || 'Withdrawal'
            });
            fetchMembers();
            setWithdrawalModal(null);
            setWithdrawalData({ amount: '', description: '' });
        } catch (error) {
            console.error('Error processing withdrawal:', error);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Team Members</h1>
                <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                    <MdAdd /> Add Member
                </button>
            </div>

            {showForm && (
                <TeamMemberForm
                    onSubmit={editingMember ? handleUpdateMember : handleAddMember}
                    onClose={handleCloseForm}
                    editData={editingMember}
                />
            )}

            <div className={styles.membersList}>
                {members.map((member) => (
                    <div key={member._id} className={styles.memberCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.profileSection}>
                                <div className={styles.avatar}>
                                    {member.profileImage ? (
                                        <img src={member.profileImage} alt={member.name} />
                                    ) : (
                                        <MdPerson />
                                    )}
                                </div>
                                <div className={styles.nameSection}>
                                    <h3>{member.name}</h3>
                                    <p className={styles.role}>{member.role}</p>
                                </div>
                                <span
                                    className={styles.statusBadge}
                                    style={{
                                        background: `${getStatusColor(member.status)}15`,
                                        color: getStatusColor(member.status)
                                    }}
                                >
                                    {member.status}
                                </span>
                            </div>
                            <div className={styles.actions}>
                                <button onClick={() => handleEditClick(member)} className={styles.editBtn}>
                                    <MdEdit />
                                </button>
                                <button onClick={() => handleDeleteMember(member._id)} className={styles.deleteBtn}>
                                    <MdDelete />
                                </button>
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.contactInfo}>
                                <div className={styles.infoItem}>
                                    <MdEmail className={styles.icon} />
                                    <span>{member.email}</span>
                                </div>
                                {member.phone && (
                                    <div className={styles.infoItem}>
                                        <MdPhone className={styles.icon} />
                                        <span>{member.phone}</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.financialSection}>
                                <h4>Financial Overview</h4>
                                <div className={styles.financialGrid}>
                                    <div className={styles.financialItem}>
                                        <span className={styles.financialLabel}>Total Earned</span>
                                        <span className={styles.financialValue}>
                                            {member.totalEarned?.toFixed(2) || '0.00'} TND
                                        </span>
                                    </div>

                                    <div className={styles.financialItem}>
                                        <span className={styles.financialLabel}>Total Received</span>
                                        <span className={styles.financialValue}>
                                            {member.totalReceived?.toFixed(2) || '0.00'} TND
                                        </span>
                                    </div>

                                    <div className={styles.financialItem}>
                                        <span className={styles.financialLabel}>Total Withdrawn</span>
                                        <span className={styles.financialValue}>
                                            {member.totalWithdrawn?.toFixed(2) || '0.00'} TND
                                        </span>
                                    </div>

                                    <div className={styles.financialItem}>
                                        <span className={styles.financialLabel}>Pending</span>
                                        <span className={styles.financialValue} style={{ color: '#f59e0b' }}>
                                            {member.pendingEarnings?.toFixed(2) || '0.00'} TND
                                        </span>
                                    </div>

                                    <div className={styles.balanceCard}>
                                        <MdAccountBalance />
                                        <div>
                                            <span className={styles.balanceLabel}>Balance</span>
                                            <span className={`${styles.balanceValue} ${member.balance < 0 ? styles.negative : styles.positive}`}>
                                                {member.balance?.toFixed(2) || '0.00'} TND
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {member.balance < 0 && (
                                    <div className={styles.debtInfo}>
                                        ⚠️ Member owes Redix: {Math.abs(member.balance).toFixed(2)} TND
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className={styles.quickActions}>
                                <button
                                    className={styles.commissionBtn}
                                    onClick={() => setCommissionModal(member)}
                                >
                                    <MdPayment /> Pay Commission
                                </button>
                                <button
                                    className={styles.withdrawBtn}
                                    onClick={() => setWithdrawalModal(member)}
                                >
                                    <MdMoneyOff /> Withdrawal
                                </button>
                            </div>

                            {member.transactions && member.transactions.length > 0 && (
                                <div className={styles.transactionsSection}>
                                    <h4>Recent Transactions</h4>
                                    <div className={styles.transactionsList}>
                                        {member.transactions.slice(-5).reverse().map((transaction, idx) => (
                                            <div key={idx} className={styles.transactionItem}>
                                                <div>
                                                    <span className={`${styles.transactionType} ${styles['type_' + transaction.type]}`}>
                                                        {transaction.type}
                                                    </span>
                                                    {transaction.description && (
                                                        <span className={styles.transactionDesc}>{transaction.description}</span>
                                                    )}
                                                </div>
                                                <span className={`${styles.transactionAmount} ${
                                                    transaction.type === 'earning' ? styles.positive : styles.negative
                                                }`}>
                                                    {transaction.type === 'earning' ? '+' : '-'}
                                                    {transaction.amount?.toFixed(2)} TND
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Commission Modal */}
            {commissionModal && (
                <div className={styles.modalOverlay} onClick={() => setCommissionModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3>Pay Commission to {commissionModal.name}</h3>
                        <p className={styles.modalBalance}>
                            Current Balance: <strong>{commissionModal.balance?.toFixed(2) || '0.00'} TND</strong>
                        </p>
                        <div className={styles.modalField}>
                            <label>Amount (TND)</label>
                            <input
                                type="number"
                                value={commissionData.amount}
                                onChange={e => setCommissionData(prev => ({ ...prev, amount: e.target.value }))}
                                placeholder="Enter amount"
                                min="0"
                                step="0.01"
                                autoFocus
                            />
                        </div>
                        <div className={styles.modalField}>
                            <label>Description</label>
                            <input
                                type="text"
                                value={commissionData.description}
                                onChange={e => setCommissionData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="e.g., Monthly commission"
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancel} onClick={() => setCommissionModal(null)}>
                                Cancel
                            </button>
                            <button className={styles.modalConfirm} onClick={handleCommissionSubmit}>
                                <MdPayment /> Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdrawal Modal */}
            {withdrawalModal && (
                <div className={styles.modalOverlay} onClick={() => setWithdrawalModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3>Withdrawal for {withdrawalModal.name}</h3>
                        <p className={styles.modalBalance}>
                            Current Balance: <strong>{withdrawalModal.balance?.toFixed(2) || '0.00'} TND</strong>
                        </p>
                        <div className={styles.modalField}>
                            <label>Amount (TND)</label>
                            <input
                                type="number"
                                value={withdrawalData.amount}
                                onChange={e => setWithdrawalData(prev => ({ ...prev, amount: e.target.value }))}
                                placeholder="Enter amount"
                                min="0"
                                step="0.01"
                                autoFocus
                            />
                        </div>
                        <div className={styles.modalField}>
                            <label>Description</label>
                            <input
                                type="text"
                                value={withdrawalData.description}
                                onChange={e => setWithdrawalData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="e.g., Cash withdrawal"
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancel} onClick={() => setWithdrawalModal(null)}>
                                Cancel
                            </button>
                            <button className={styles.modalConfirm} onClick={handleWithdrawalSubmit}>
                                <MdMoneyOff /> Confirm Withdrawal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamMembersList;
