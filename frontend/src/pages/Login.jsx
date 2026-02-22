import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { verifyPasskey } from '../services/SettingsServices';
import styles from './Login.module.css';

const Login = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Passkey gate
    const [passkeyUnlocked, setPasskeyUnlocked] = useState(false);
    const [passkeyInput, setPasskeyInput] = useState('');
    const [passkeyError, setPasskeyError] = useState('');
    const [passkeyLoading, setPasskeyLoading] = useState(false);

    const handlePasskeySubmit = async (e) => {
        e.preventDefault();
        setPasskeyError('');
        setPasskeyLoading(true);
        try {
            const result = await verifyPasskey(passkeyInput);
            if (result.valid) {
                setPasskeyUnlocked(true);
            } else {
                setPasskeyError('Invalid passkey.');
            }
        } catch {
            setPasskeyError('Could not verify passkey. Try again.');
        } finally {
            setPasskeyLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /* ── 404 passkey gate ─────────────────────────────── */
    if (!passkeyUnlocked) {
        return (
            <div className={styles.loginPage}>
                <div className={styles.bgAnimation}>
                    <div className={styles.orb + ' ' + styles.orb1}></div>
                    <div className={styles.orb + ' ' + styles.orb2}></div>
                    <div className={styles.orb + ' ' + styles.orb3}></div>
                    <div className={styles.orb + ' ' + styles.orb4}></div>
                </div>
                <div className={styles.notFoundWrap}>
                    <div className={styles.notFoundCode}>404</div>
                    <h2 className={styles.notFoundTitle}>Page Not Found</h2>
                    <p className={styles.notFoundSub}>
                        The page you are looking for doesn&rsquo;t exist or has been moved.
                    </p>
                    <form onSubmit={handlePasskeySubmit} className={styles.passkeyForm}>
                        <input
                            type="password"
                            className={styles.passkeyInput}
                            placeholder="Enter passkey to continue…"
                            value={passkeyInput}
                            onChange={(e) => setPasskeyInput(e.target.value)}
                            autoComplete="off"
                        />
                        {passkeyError && <p className={styles.passkeyError}>{passkeyError}</p>}
                        <button type="submit" className={styles.passkeyBtn} disabled={passkeyLoading || !passkeyInput}>
                            {passkeyLoading ? 'Verifying…' : 'Unlock'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    /* ── Actual login form (passkey verified) ──────────── */
    return (
        <div className={styles.loginPage}>
            {/* Animated background */}
            <div className={styles.bgAnimation}>
                <div className={styles.orb + ' ' + styles.orb1}></div>
                <div className={styles.orb + ' ' + styles.orb2}></div>
                <div className={styles.orb + ' ' + styles.orb3}></div>
                <div className={styles.orb + ' ' + styles.orb4}></div>
            </div>

            {/* Floating particles */}
            <div className={styles.particles}>
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className={styles.particle}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 6}s`,
                            animationDuration: `${3 + Math.random() * 4}s`,
                            width: `${2 + Math.random() * 4}px`,
                            height: `${2 + Math.random() * 4}px`,
                        }}
                    />
                ))}
            </div>

            <div className={styles.loginContainer}>
                {/* Left panel - branding */}
                <div className={styles.brandPanel}>
                    <div className={styles.brandContent}>
                        <div className={styles.logoIcon}>
                            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="2"/>
                                <path d="M24 4L42 14L24 24L6 14L24 4Z" fill="rgba(255,255,255,0.25)"/>
                                <path d="M24 24V44L6 34V14L24 24Z" fill="rgba(255,255,255,0.1)"/>
                                <circle cx="24" cy="22" r="6" fill="white" fillOpacity="0.9"/>
                                <path d="M18 30C18 27 21 25 24 25C27 25 30 27 30 30" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                            </svg>
                        </div>
                        <h1 className={styles.brandTitle}>Redix Agency</h1>
                        <p className={styles.brandSubtitle}>Management Platform</p>
                        <div className={styles.brandDivider}></div>
                        <p className={styles.brandDescription}>
                            Streamline your agency workflow with powerful project management, 
                            financial tracking, and team collaboration tools.
                        </p>
                        <div className={styles.features}>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>📊</span>
                                <span>Real-time Analytics</span>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>👥</span>
                                <span>Team Management</span>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>💰</span>
                                <span>Financial Tracking</span>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>🚀</span>
                                <span>Project Delivery</span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.brandFooter}>
                        <p>© 2026 Redix Digital Solutions</p>
                    </div>
                </div>

                {/* Right panel - login form */}
                <div className={styles.formPanel}>
                    <div className={styles.formContent}>
                        <div className={styles.formHeader}>
                            <h2 className={styles.welcomeText}>Welcome back</h2>
                            <p className={styles.welcomeSub}>Sign in to your account to continue</p>
                        </div>

                        {error && (
                            <div className={styles.errorAlert}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email Address</label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                        <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        className={styles.input}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Password</label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                                    </svg>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className={styles.input}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.togglePassword}
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className={styles.spinner}></div>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="5" y1="12" x2="19" y2="12"/>
                                            <polyline points="12 5 19 12 12 19"/>
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className={styles.formFooter}>
                            <p className={styles.footerText}>Redix Agency Management Platform</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
