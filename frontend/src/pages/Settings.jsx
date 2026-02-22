import React, { useState } from 'react';
import { updatePasskey } from '../services/SettingsServices';
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
