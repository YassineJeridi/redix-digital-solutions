import React, { useState, useEffect, useRef } from 'react';
import {
    MdPerson, MdAccountBalanceWallet, MdTrendingUp,
    MdArrowDownward, MdPeople, MdHistory, MdSend,
    MdEdit, MdSave, MdClose, MdEmail, MdPhone, MdLock, MdHourglassEmpty, MdCameraAlt
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import * as SettingsServices from '../services/SettingsServices';
import AuthService from '../services/AuthServices';
import styles from './Profile.module.css';

const Profile = () => {
    const { user } = useAuth();
    const [myProfile, setMyProfile] = useState(null);
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [withdrawalDescription, setWithdrawalDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = useRef(null);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: '', email: '', phone: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const members = await SettingsServices.getTeamMembers();
            setAllMembers(members);
            const me = members.find(m => m.email === user?.email);
            setMyProfile(me || null);
            if (me) {
                setEditData({ name: me.name || '', email: me.email || '', phone: me.phone || '' });
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawal = async (e) => {
        e.preventDefault();
        if (!myProfile || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0) return;

        try {
            setSubmitting(true);
            await SettingsServices.addWithdrawalToMember(myProfile._id, {
                amount: parseFloat(withdrawalAmount),
                description: withdrawalDescription || 'Withdrawal'
            });
            setWithdrawalAmount('');
            setWithdrawalDescription('');
            await loadData();
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            alert('Error processing withdrawal: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!myProfile) return;
        try {
            setSubmitting(true);
            await SettingsServices.updateTeamMember(myProfile._id, editData);
            setSaveMsg('Profile updated successfully!');
            setIsEditing(false);
            await loadData();
            setTimeout(() => setSaveMsg(''), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setSaveMsg('Error updating profile');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !myProfile) return;
        if (!file.type.startsWith('image/')) { setSaveMsg('Please select an image file.'); return; }
        if (file.size > 2 * 1024 * 1024) { setSaveMsg('Image must be under 2 MB.'); return; }
        try {
            setAvatarUploading(true);
            const base64 = await new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onload = () => res(reader.result);
                reader.onerror = rej;
                reader.readAsDataURL(file);
            });
            await SettingsServices.updateTeamMember(myProfile._id, { profileImage: base64 });
            setSaveMsg('Avatar updated!');
            await loadData();
            setTimeout(() => setSaveMsg(''), 3000);
        } catch (err) {
            setSaveMsg('Failed to update avatar.');
            setTimeout(() => setSaveMsg(''), 3000);
        } finally {
            setAvatarUploading(false);
            e.target.value = '';
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setSaveMsg('New passwords do not match');
            setTimeout(() => setSaveMsg(''), 3000);
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setSaveMsg('Password must be at least 6 characters');
            setTimeout(() => setSaveMsg(''), 3000);
            return;
        }
        try {
            setSubmitting(true);
            await AuthService.changePassword(passwordData.currentPassword, passwordData.newPassword);
            setSaveMsg('Password updated successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordForm(false);
            setTimeout(() => setSaveMsg(''), 3000);
        } catch (error) {
            console.error('Error changing password:', error);
            setSaveMsg(error.response?.data?.message || 'Error changing password');
            setTimeout(() => setSaveMsg(''), 4000);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (!myProfile) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <MdPerson className={styles.emptyIcon} />
                    <h2>No team profile found</h2>
                    <p>Your account ({user?.email}) is not linked to a team member profile yet.</p>
                </div>
            </div>
        );
    }

    const currentBalance = (myProfile.totalReceived || 0) - (myProfile.totalWithdrawn || 0);
    const withdrawals = (myProfile.transactions || []).filter(t => t.type === 'withdrawal');
    const earnings = (myProfile.transactions || []).filter(t => t.type === 'earning');
    const otherMembers = allMembers.filter(m => m._id !== myProfile._id);

    return (
        <div className={styles.container}>
            {saveMsg && (
                <div className={styles.toast}>{saveMsg}</div>
            )}

            {/* Profile Header */}
            <div className={styles.profileHeader}>
                <div className={styles.avatarWrapper}>
                    <div className={styles.avatar}>
                        {myProfile.profileImage ? (
                            <img src={myProfile.profileImage} alt={myProfile.name} />
                        ) : (
                            myProfile.name?.charAt(0)?.toUpperCase() || 'U'
                        )}
                    </div>
                    <button
                        className={styles.avatarEditBtn}
                        onClick={() => avatarInputRef.current?.click()}
                        title="Change profile picture"
                        disabled={avatarUploading}
                    >
                        {avatarUploading ? <span className={styles.avatarSpinner} /> : <MdCameraAlt />}
                    </button>
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                    />
                </div>
                <div className={styles.profileInfo}>
                    {isEditing ? (
                        <div className={styles.editFields}>
                            <div className={styles.editRow}>
                                <MdPerson />
                                <input
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    placeholder="Full Name"
                                />
                            </div>
                            <div className={styles.editRow}>
                                <MdEmail />
                                <input
                                    type="email"
                                    value={editData.email}
                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                    placeholder="Email"
                                />
                            </div>
                            <div className={styles.editRow}>
                                <MdPhone />
                                <input
                                    type="tel"
                                    value={editData.phone}
                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                    placeholder="Phone"
                                />
                            </div>
                            <div className={styles.editActions}>
                                <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={submitting}>
                                    <MdSave /> Save
                                </button>
                                <button className={styles.cancelEditBtn} onClick={() => {
                                    setIsEditing(false);
                                    setEditData({ name: myProfile.name || '', email: myProfile.email || '', phone: myProfile.phone || '' });
                                }}>
                                    <MdClose /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1>{myProfile.name}</h1>
                            <span className={styles.role}>{myProfile.role}</span>
                            <span className={styles.email}>{myProfile.email}</span>
                            {myProfile.phone && <span className={styles.phone}><MdPhone size={14} /> {myProfile.phone}</span>}
                            <button className={styles.editProfileBtn} onClick={() => setIsEditing(true)}>
                                <MdEdit /> Edit Profile
                            </button>
                            <button className={styles.changePasswordBtn} onClick={() => setShowPasswordForm(!showPasswordForm)}>
                                <MdLock /> Change Password
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Password Change Form */}
            {showPasswordForm && (
                <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                    <h3><MdLock /> Change Password</h3>
                    <form onSubmit={handleChangePassword} className={styles.passwordForm}>
                        <div className={styles.formGroup}>
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                placeholder="Enter current password"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>New Password</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                placeholder="Min 6 characters"
                                minLength="6"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                placeholder="Confirm new password"
                                minLength="6"
                                required
                            />
                        </div>
                        <div className={styles.editActions}>
                            <button type="submit" className={styles.saveBtn} disabled={submitting}>
                                <MdSave /> {submitting ? 'Updating...' : 'Update Password'}
                            </button>
                            <button type="button" className={styles.cancelEditBtn} onClick={() => {
                                setShowPasswordForm(false);
                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            }}>
                                <MdClose /> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Financial Overview */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        <MdTrendingUp style={{ color: '#10b981' }} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Total Received</span>
                        <span className={styles.statValue}>{(myProfile.totalReceived || 0).toLocaleString()} TND</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                        <MdArrowDownward style={{ color: '#f59e0b' }} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Total Withdrawn</span>
                        <span className={styles.statValue}>{(myProfile.totalWithdrawn || 0).toLocaleString()} TND</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(193, 45, 224, 0.1)' }}>
                        <MdAccountBalanceWallet style={{ color: '#c12de0' }} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Current Balance</span>
                        <span className={`${styles.statValue} ${currentBalance >= 0 ? styles.positive : styles.negative}`}>
                            {currentBalance.toLocaleString()} TND
                        </span>
                    </div>
                </div>
                {(myProfile.pendingEarnings || 0) > 0 && (
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                            <MdHourglassEmpty style={{ color: '#a855f7' }} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statLabel}>Pending Earnings</span>
                            <span className={styles.statValue} style={{ color: '#a855f7' }}>
                                {(myProfile.pendingEarnings || 0).toLocaleString()} TND
                            </span>
                        </div>
                    </div>
                )}
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                        <MdHistory style={{ color: '#3b82f6' }} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>Transactions</span>
                        <span className={styles.statValue}>{(myProfile.transactions || []).length}</span>
                    </div>
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* Withdrawal Section */}
                <div className={styles.card}>
                    <h3><MdArrowDownward /> Withdrawal</h3>
                    <form onSubmit={handleWithdrawal} className={styles.withdrawalForm}>
                        <div className={styles.formGroup}>
                            <label>Amount (TND)</label>
                            <input
                                type="number"
                                value={withdrawalAmount}
                                onChange={(e) => setWithdrawalAmount(e.target.value)}
                                placeholder="0.00"
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description (optional)</label>
                            <input
                                type="text"
                                value={withdrawalDescription}
                                onChange={(e) => setWithdrawalDescription(e.target.value)}
                                placeholder="Reason for withdrawal..."
                            />
                        </div>
                        <button type="submit" className={styles.withdrawBtn} disabled={submitting}>
                            <MdSend /> {submitting ? 'Processing...' : 'Withdraw'}
                        </button>
                    </form>

                    {withdrawals.length > 0 && (
                        <div className={styles.historySection}>
                            <h4>Withdrawal History</h4>
                            <div className={styles.historyList}>
                                {withdrawals.slice().reverse().map((tx, idx) => (
                                    <div key={idx} className={styles.historyItem}>
                                        <div className={styles.historyInfo}>
                                            <span className={styles.historyAmount}>-{tx.amount.toLocaleString()} TND</span>
                                            <span className={styles.historyDesc}>{tx.description}</span>
                                        </div>
                                        <span className={styles.historyDate}>
                                            {new Date(tx.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Earnings */}
                <div className={styles.card}>
                    <h3><MdTrendingUp /> Recent Earnings</h3>
                    {earnings.length > 0 ? (
                        <div className={styles.historyList}>
                            {earnings.slice().reverse().slice(0, 10).map((tx, idx) => (
                                <div key={idx} className={styles.historyItem}>
                                    <div className={styles.historyInfo}>
                                        <span className={styles.historyAmountPositive}>+{tx.amount.toLocaleString()} TND</span>
                                        <span className={styles.historyDesc}>{tx.description}</span>
                                    </div>
                                    <span className={styles.historyDate}>
                                        {new Date(tx.date).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.noData}>No earnings yet</p>
                    )}
                </div>
            </div>

            {/* Team Evolution */}
            <div className={styles.card}>
                <h3><MdPeople /> Team Evolution</h3>
                <p className={styles.teamSubtitle}>See how your teammates are doing — stay motivated!</p>
                <div className={styles.teamGrid}>
                    {otherMembers.map((member) => (
                        <div key={member._id} className={styles.teamCard}>
                            <div className={styles.teamAvatar}>
                                {member.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className={styles.teamInfo}>
                                <span className={styles.teamName}>{member.name}</span>
                                <span className={styles.teamRole}>{member.role}</span>
                            </div>
                            <div className={styles.teamStats}>
                                <div className={styles.teamStatItem}>
                                    <span className={styles.teamStatLabel}>Received</span>
                                    <span className={styles.teamStatValue}>{(member.totalReceived || 0).toLocaleString()} TND</span>
                                </div>
                                <div className={styles.teamStatItem}>
                                    <span className={styles.teamStatLabel}>Projects</span>
                                    <span className={styles.teamStatValue}>
                                        {(member.transactions || []).filter(t => t.type === 'earning').length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {otherMembers.length === 0 && (
                        <p className={styles.noData}>No other team members yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
