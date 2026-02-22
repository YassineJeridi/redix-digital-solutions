import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyPasskey } from '../services/SettingsServices';
import styles from './NotFound.module.css';

const NotFound = () => {
    const navigate = useNavigate();
    const [unlockVisible, setUnlockVisible] = useState(false);
    const [passkey, setPasskey] = useState('');
    const [shake, setShake] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    // Focus input when unlock panel opens
    useEffect(() => {
        if (unlockVisible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [unlockVisible]);

    const handleLockClick = () => {
        setUnlockVisible((v) => !v);
        setError('');
        setPasskey('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!passkey.trim()) return;
        setLoading(true);
        setError('');
        try {
            const { valid } = await verifyPasskey(passkey.trim());
            if (valid) {
                navigate('/login');
            } else {
                setShake(true);
                setError('Incorrect passkey.');
                setTimeout(() => setShake(false), 600);
            }
        } catch {
            setError('Unable to verify. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Background glows */}
            <div className={styles.glowA} />
            <div className={styles.glowB} />

            <div className={styles.content}>
                <div className={styles.code}>404</div>
                <h1 className={styles.title}>Page not found</h1>
                <p className={styles.subtitle}>
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
            </div>

            {/* Passkey section — bottom of page */}
            <div className={styles.lockArea}>
                {unlockVisible && (
                    <form
                        onSubmit={handleSubmit}
                        className={`${styles.passkeyBox} ${shake ? styles.shake : ''}`}
                    >
                        <input
                            ref={inputRef}
                            type="password"
                            className={styles.passkeyInput}
                            placeholder="Enter passkey…"
                            value={passkey}
                            onChange={(e) => { setPasskey(e.target.value); setError(''); }}
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <button
                            type="submit"
                            className={styles.passkeyBtn}
                            disabled={loading}
                        >
                            {loading ? '…' : '→'}
                        </button>
                        {error && <span className={styles.errorMsg}>{error}</span>}
                    </form>
                )}

                <button
                    className={`${styles.lockBtn} ${unlockVisible ? styles.lockActive : ''}`}
                    onClick={handleLockClick}
                    title={unlockVisible ? 'Close' : 'Enter passkey'}
                    aria-label="Toggle passkey entry"
                >
                    {unlockVisible ? (
                        // Open lock SVG
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                        </svg>
                    ) : (
                        // Closed lock SVG
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default NotFound;
