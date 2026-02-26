import React, { useState, useEffect, useCallback } from 'react';
import { updatePasskey, verifyPasskey, getTeamMembers, getCaisseBalance, addCaisseDeposit, addCaisseDeduction, adjustPendingEarnings } from '../services/SettingsServices';
import styles from './Settings.module.css';

const Settings = () => {
    const [companyName, setCompanyName] = useState('Redix Digital Solutions');
    const [currency, setCurrency] = useState('TND');
    const [language, setLanguage] = useState('fr');
    const [saved, setSaved] = useState(false);

    // Passkey state
    const [currentPasskey, setCurrentPasskey] = useState('');
    const [newPasskey, setNewPasskey] = useState('');
    const [confirmPasskey, setConfirmPasskey] = useState('');
    const [passkeySaved, setPasskeySaved] = useState(false);
    const [passkeyError, setPasskeyError] = useState('');
    const [passkeyLoading, setPasskeyLoading] = useState(false);

    // ── Financial Management (passkey-gated) ──────────────────
    const [finUnlocked, setFinUnlocked] = useState(false);
    const [finPasskey, setFinPasskey] = useState('');
    const [finPasskeyError, setFinPasskeyError] = useState('');
    const [finPasskeyLoading, setFinPasskeyLoading] = useState(false);

    // Pending Earnings
    const [members, setMembers] = useState([]);
    const [peEditing, setPeEditing] = useState(null); // memberId being edited
    const [peAmount, setPeAmount] = useState('');
    const [peType, setPeType] = useState('set');
    const [peDesc, setPeDesc] = useState('');
    const [peSaving, setPeSaving] = useState(false);
    const [peMsg, setPeMsg] = useState('');

    // Redix Caisse
    const [caisse, setCaisse] = useState(null);
    const [caisseMode, setCaisseMode] = useState('deposit'); // 'deposit' | 'deduct'
    const [caisseAmount, setCaisseAmount] = useState('');
    const [caisseDesc, setCaisseDesc] = useState('');
    const [caisseSource, setCaisseSource] = useState('');
    const [caisseSaving, setCaisseSaving] = useState(false);
    const [caisseMsg, setCaisseMsg] = useState('');

    const loadFinancials = useCallback(async () => {
        try {
            const [mems, caisseData] = await Promise.all([getTeamMembers(), getCaisseBalance()]);
            setMembers(mems || []);
            setCaisse(caisseData);
        } catch {}
    }, []);

    useEffect(() => {
        if (finUnlocked) loadFinancials();
    }, [finUnlocked, loadFinancials]);

    const handleUnlockFinancials = async () => {
        if (!finPasskey.trim()) { setFinPasskeyError('Enter the passkey'); return; }
        setFinPasskeyLoading(true);
        setFinPasskeyError('');
        try {
            const res = await verifyPasskey(finPasskey.trim());
            if (!res.valid) { setFinPasskeyError('Incorrect passkey'); return; }
            setFinUnlocked(true);
            setFinPasskey('');
        } catch {
            setFinPasskeyError('Verification failed. Try again.');
        } finally {
            setFinPasskeyLoading(false);
        }
    };

    const handleAdjustPending = async (memberId) => {
        if (!peAmount && peType !== 'set') return;
        setPeSaving(true);
        setPeMsg('');
        try {
            await adjustPendingEarnings(memberId, { amount: parseFloat(peAmount) || 0, type: peType, description: peDesc });
            await loadFinancials();
            setPeEditing(null);
            setPeAmount('');
            setPeDesc('');
            setPeMsg('✓ Updated');
            setTimeout(() => setPeMsg(''), 2500);
        } catch (err) {
            setPeMsg(err.response?.data?.message || 'Error updating');
        } finally {
            setPeSaving(false);
        }
    };

    const handleCaisseAction = async () => {
        if (!caisseAmount || parseFloat(caisseAmount) <= 0) return;
        setCaisseSaving(true);
        setCaisseMsg('');
        try {
            const fn = caisseMode === 'deposit' ? addCaisseDeposit : addCaisseDeduction;
            const res = await fn({ amount: parseFloat(caisseAmount), description: caisseDesc, source: caisseSource });
            setCaisse(prev => ({ ...prev, balance: res.balance, depositHistory: res.depositHistory }));
            setCaisseAmount('');
            setCaisseDesc('');
            setCaisseSource('');
            setCaisseMsg(`✓ ${caisseMode === 'deposit' ? 'Deposit' : 'Deduction'} applied`);
            setTimeout(() => setCaisseMsg(''), 3000);
        } catch (err) {
            setCaisseMsg(err.response?.data?.message || 'Error');
        } finally {
            setCaisseSaving(false);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleUpdatePasskey = async (e) => {
        e.preventDefault();
        setPasskeyError('');
        setPasskeySaved(false);
        if (!currentPasskey) {
            setPasskeyError('Please enter your current passkey.');
            return;
        }
        if (newPasskey.length < 4) {
            setPasskeyError('New passkey must be at least 4 characters.');
            return;
        }
        if (newPasskey !== confirmPasskey) {
            setPasskeyError('New passkeys do not match.');
            return;
        }
        setPasskeyLoading(true);
        try {
            await updatePasskey(newPasskey, currentPasskey);
            setPasskeySaved(true);
            setCurrentPasskey('');
            setNewPasskey('');
            setConfirmPasskey('');
            setTimeout(() => setPasskeySaved(false), 2500);
        } catch (err) {
            setPasskeyError(err.response?.data?.message || 'Failed to update passkey.');
        } finally {
            setPasskeyLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <h1 className={styles.pageTitle}>Settings</h1>

            <div className={styles.settingsGrid}>
                {/* General Settings */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>⚙️ General</h2>
                    <form onSubmit={handleSave} className={styles.form}>
                        <div className={styles.field}>
                            <label>Company Name</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Currency</label>
                            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                                <option value="TND">TND - Tunisian Dinar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="USD">USD - US Dollar</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Language</label>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                                <option value="ar">العربية</option>
                            </select>
                        </div>
                        <button type="submit" className={styles.saveBtn}>
                            {saved ? '✓ Saved' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Passkey */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>🔑 Passkey</h2>
                    <p className={styles.cardDesc}>
                        The passkey is required to access the login page.
                        Users who don&rsquo;t know the passkey will see a 404 page instead.
                    </p>
                    <form onSubmit={handleUpdatePasskey} className={styles.form}>
                        <div className={styles.field}>
                            <label>Current Passkey</label>
                            <input
                                type="password"
                                value={currentPasskey}
                                onChange={(e) => setCurrentPasskey(e.target.value)}
                                placeholder="Enter current passkey"
                                autoComplete="current-password"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>New Passkey</label>
                            <input
                                type="password"
                                value={newPasskey}
                                onChange={(e) => setNewPasskey(e.target.value)}
                                placeholder="Min. 4 characters"
                                autoComplete="new-password"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Confirm New Passkey</label>
                            <input
                                type="password"
                                value={confirmPasskey}
                                onChange={(e) => setConfirmPasskey(e.target.value)}
                                placeholder="Repeat new passkey"
                                autoComplete="new-password"
                            />
                        </div>
                        {passkeyError && <p className={styles.errorMsg}>{passkeyError}</p>}
                        <button
                            type="submit"
                            className={styles.saveBtn}
                            disabled={passkeyLoading}
                        >
                            {passkeySaved ? '✓ Passkey Updated' : passkeyLoading ? 'Updating…' : 'Update Passkey'}
                        </button>
                    </form>
                </div>

                {/* Financial Management — Passkey Gated */}
                <div className={`${styles.card} ${styles.finCard}`}>
                    <h2 className={styles.cardTitle}>💰 Financial Management</h2>
                    <p className={styles.cardDesc}>Manage team member Pending Earnings and the Redix Caisse. Passkey required.</p>

                    {!finUnlocked ? (
                        <div className={styles.finLockWrap}>
                            <div className={styles.finLockIcon}>🔐</div>
                            <p className={styles.finLockHint}>Enter the passkey to unlock</p>
                            <div className={styles.finLockRow}>
                                <input
                                    type="password"
                                    className={`${styles.finPasskeyInput} ${finPasskeyError ? styles.inputError : ''}`}
                                    placeholder="Enter passkey..."
                                    value={finPasskey}
                                    onChange={(e) => { setFinPasskey(e.target.value); setFinPasskeyError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUnlockFinancials()}
                                    autoComplete="off"
                                />
                                <button className={styles.unlockBtn} onClick={handleUnlockFinancials} disabled={finPasskeyLoading}>
                                    {finPasskeyLoading ? '...' : '🔓 Unlock'}
                                </button>
                            </div>
                            {finPasskeyError && <p className={styles.errorMsg}>{finPasskeyError}</p>}
                        </div>
                    ) : (
                        <div className={styles.finPanel}>
                            <button className={styles.lockBtn} onClick={() => { setFinUnlocked(false); setFinPasskey(''); }}>🔒 Lock</button>

                            {/* ── Pending Earnings ── */}
                            <div className={styles.finSection}>
                                <h3 className={styles.finSectionTitle}>⏳ Pending Earnings</h3>
                                {peMsg && <p className={styles.finMsg}>{peMsg}</p>}
                                <div className={styles.peTable}>
                                    {members.filter(m => (m.pendingEarnings || 0) > 0 || peEditing === m._id).map(member => (
                                        <div key={member._id} className={styles.peRow}>
                                            <div className={styles.peMemberInfo}>
                                                <span className={styles.peName}>{member.name}</span>
                                                <span className={styles.peRole}>{member.role}</span>
                                            </div>
                                            <span className={styles.peBadge}>
                                                {(member.pendingEarnings || 0).toLocaleString()} TND
                                            </span>
                                            {peEditing === member._id ? (
                                                <div className={styles.peEditRow}>
                                                    <select
                                                        className={styles.peSelect}
                                                        value={peType}
                                                        onChange={(e) => setPeType(e.target.value)}
                                                    >
                                                        <option value="set">Set to</option>
                                                        <option value="add">Add</option>
                                                        <option value="subtract">Subtract</option>
                                                    </select>
                                                    <input
                                                        type="number"
                                                        className={styles.peInput}
                                                        placeholder="Amount"
                                                        value={peAmount}
                                                        onChange={(e) => setPeAmount(e.target.value)}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                    <input
                                                        type="text"
                                                        className={styles.peInput}
                                                        placeholder="Reason (optional)"
                                                        value={peDesc}
                                                        onChange={(e) => setPeDesc(e.target.value)}
                                                    />
                                                    <div className={styles.peEditBtns}>
                                                        <button
                                                            className={styles.peConfirmBtn}
                                                            onClick={() => handleAdjustPending(member._id)}
                                                            disabled={peSaving}
                                                        >
                                                            {peSaving ? '...' : '✓'}
                                                        </button>
                                                        <button
                                                            className={styles.peCancelBtn}
                                                            onClick={() => { setPeEditing(null); setPeAmount(''); setPeDesc(''); }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    className={styles.peEditBtn}
                                                    onClick={() => { setPeEditing(member._id); setPeAmount(member.pendingEarnings || 0); setPeType('set'); }}
                                                >
                                                    ✏️
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {members.filter(m => (m.pendingEarnings || 0) > 0).length === 0 && (
                                        <p className={styles.finEmpty}>No team members have pending earnings.</p>
                                    )}
                                </div>
                                {/* Also show members with zero pending so admin can still add */}
                                <details className={styles.allMembersToggle}>
                                    <summary>Show all members</summary>
                                    <div className={styles.peTable}>
                                        {members.filter(m => (m.pendingEarnings || 0) === 0 && peEditing !== m._id).map(member => (
                                            <div key={member._id} className={styles.peRow}>
                                                <div className={styles.peMemberInfo}>
                                                    <span className={styles.peName}>{member.name}</span>
                                                    <span className={styles.peRole}>{member.role}</span>
                                                </div>
                                                <span className={`${styles.peBadge} ${styles.peBadgeZero}`}>0 TND</span>
                                                {peEditing === member._id ? (
                                                    <div className={styles.peEditRow}>
                                                        <select className={styles.peSelect} value={peType} onChange={(e) => setPeType(e.target.value)}>
                                                            <option value="set">Set to</option>
                                                            <option value="add">Add</option>
                                                            <option value="subtract">Subtract</option>
                                                        </select>
                                                        <input type="number" className={styles.peInput} placeholder="Amount" value={peAmount} onChange={(e) => setPeAmount(e.target.value)} min="0" step="0.01" />
                                                        <input type="text" className={styles.peInput} placeholder="Reason (optional)" value={peDesc} onChange={(e) => setPeDesc(e.target.value)} />
                                                        <div className={styles.peEditBtns}>
                                                            <button className={styles.peConfirmBtn} onClick={() => handleAdjustPending(member._id)} disabled={peSaving}>{peSaving ? '...' : '✓'}</button>
                                                            <button className={styles.peCancelBtn} onClick={() => { setPeEditing(null); setPeAmount(''); setPeDesc(''); }}>✕</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button className={styles.peEditBtn} onClick={() => { setPeEditing(member._id); setPeAmount(0); setPeType('set'); }}>✏️</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>

                            {/* ── Redix Caisse ── */}
                            <div className={styles.finSection}>
                                <h3 className={styles.finSectionTitle}>🏦 Redix Caisse</h3>
                                {caisse !== null && (
                                    <div className={styles.caisseBalance}>
                                        <span className={styles.caisseBalanceLabel}>Current Balance</span>
                                        <span className={`${styles.caisseBalanceValue} ${(caisse.balance || 0) < 0 ? styles.negative : ''}`}>
                                            {(caisse.balance || 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND
                                        </span>
                                    </div>
                                )}
                                <div className={styles.caisseTabs}>
                                    <button
                                        className={`${styles.caisseTab} ${caisseMode === 'deposit' ? styles.caisseTabActive : ''}`}
                                        onClick={() => setCaisseMode('deposit')}
                                    >
                                        ＋ Deposit
                                    </button>
                                    <button
                                        className={`${styles.caisseTab} ${caisseMode === 'deduct' ? styles.caisseTabActive : ''}`}
                                        onClick={() => setCaisseMode('deduct')}
                                    >
                                        － Deduct
                                    </button>
                                </div>
                                <div className={styles.caisseForm}>
                                    <input
                                        type="number"
                                        className={styles.peInput}
                                        placeholder="Amount (TND)"
                                        value={caisseAmount}
                                        onChange={(e) => setCaisseAmount(e.target.value)}
                                        min="0.01"
                                        step="0.01"
                                    />
                                    <input
                                        type="text"
                                        className={styles.peInput}
                                        placeholder={caisseMode === 'deposit' ? 'Source (e.g. Cash, Transfer)' : 'Reason'}
                                        value={caisseMode === 'deposit' ? caisseSource : caisseDesc}
                                        onChange={(e) => caisseMode === 'deposit' ? setCaisseSource(e.target.value) : setCaisseDesc(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className={styles.peInput}
                                        placeholder="Description (optional)"
                                        value={caisseDesc}
                                        onChange={(e) => setCaisseDesc(e.target.value)}
                                    />
                                    {caisseMsg && <p className={styles.finMsg}>{caisseMsg}</p>}
                                    <button
                                        className={`${styles.saveBtn} ${caisseMode === 'deduct' ? styles.deductBtn : ''}`}
                                        onClick={handleCaisseAction}
                                        disabled={caisseSaving || !caisseAmount || parseFloat(caisseAmount) <= 0}
                                    >
                                        {caisseSaving ? 'Saving…' : caisseMode === 'deposit' ? '＋ Add Deposit' : '－ Apply Deduction'}
                                    </button>
                                </div>
                                {/* Recent deposit history */}
                                {caisse?.depositHistory && caisse.depositHistory.length > 0 && (
                                    <details className={styles.allMembersToggle} style={{ marginTop: 16 }}>
                                        <summary>Recent history ({caisse.depositHistory.length})</summary>
                                        <div className={styles.caisseHistory}>
                                            {caisse.depositHistory.slice(0, 10).map((entry, i) => (
                                                <div key={i} className={styles.caisseHistoryRow}>
                                                    <span className={`${styles.caisseHistAmt} ${entry.amount < 0 ? styles.negative : styles.positive}`}>
                                                        {entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString()} TND
                                                    </span>
                                                    <span className={styles.caisseHistDesc}>{entry.description}</span>
                                                    <span className={styles.caisseHistDate}>{new Date(entry.date).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* About */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>💡 About</h2>
                    <div className={styles.aboutContent}>
                        <p className={styles.appName}>Redix Digital Solutions</p>
                        <p className={styles.version}>v2.0.0</p>
                        <p className={styles.desc}>
                            Internal billing &amp; project management platform for Redix Digital Solutions agency.
                        </p>
                        <div className={styles.links}>
                            <span className={styles.link}>📊 Dashboard</span>
                            <span className={styles.link}>👥 Team Members</span>
                            <span className={styles.link}>📈 Reports</span>
                            <span className={styles.link}>💼 Investing</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
