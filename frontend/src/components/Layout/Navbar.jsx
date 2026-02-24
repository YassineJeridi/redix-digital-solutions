import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdNotifications, MdDarkMode, MdLightMode, MdPerson, MdLogout, MdClose, MdAssignment } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import * as NotificationServices from '../../services/NotificationServices';
import { getTeamMembers } from '../../services/SettingsServices';
import styles from './Navbar.module.css';

const ICON_MAP = {
    info: <MdAssignment style={{ color: '#6366f1', fontSize: 18 }} />,
    warning: '⚠️',
    success: '✅',
};

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    // Notifications
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const notifRef = useRef(null);

    // Profile dropdown
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef(null);

    // Profile image from TeamMember
    const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Fetch notifications on mount + poll every 30 s
    useEffect(() => {
        if (!user?.token) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Load profile image from TeamMember record
    useEffect(() => {
        if (!user?.email) return;
        getTeamMembers().then(members => {
            const arr = members.data || members || [];
            const me = arr.find(m => m.email === user.email);
            if (me?.profileImage) setProfileImage(me.profileImage);
        }).catch(() => {});
    }, [user]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await NotificationServices.getNotifications();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch {
            // Silently fail
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await NotificationServices.markAsRead(id);
            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (err) {
            console.error('Error marking read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await NotificationServices.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all read:', err);
        }
    };

    const handleDeleteNotification = async (id) => {
        try {
            await NotificationServices.deleteNotification(id);
            const wasUnread = notifications.find((n) => n._id === id && !n.isRead);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const handleNotifClick = (notif) => {
        if (!notif.isRead) handleMarkAsRead(notif._id);

        // Navigate based on notification content
        if (notif.message?.toLowerCase().includes('task') || notif.relatedId) {
            navigate('/tasks');
        }
        setShowNotifications(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.right}>
                <button className={styles.iconBtn} onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                    {darkMode ? <MdLightMode /> : <MdDarkMode />}
                </button>

                {/* Notifications */}
                <div className={styles.notifWrapper} ref={notifRef}>
                    <button
                        className={styles.iconBtn}
                        onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                    >
                        <MdNotifications />
                        {unreadCount > 0 && (
                            <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className={styles.notifList}>
                                {notifications.length === 0 ? (
                                    <div className={styles.emptyNotif}>
                                        <MdNotifications size={32} />
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            className={`${styles.notifItem} ${!notif.isRead ? styles.unread : ''}`}
                                            onClick={() => handleNotifClick(notif)}
                                        >
                                            <span className={styles.notifIcon}>{ICON_MAP[notif.type] || 'ℹ️'}</span>
                                            <div className={styles.notifContent}>
                                                <span className={styles.notifTitle}>{notif.type === 'success' ? 'Success' : notif.type === 'warning' ? 'Warning' : 'Info'}</span>
                                                <span className={styles.notifMessage}>{notif.message}</span>
                                                <span className={styles.notifTime}>{timeAgo(notif.createdAt)}</span>
                                            </div>
                                            <button
                                                className={styles.notifDeleteBtn}
                                                onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notif._id); }}
                                            >
                                                <MdClose size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className={styles.profileWrapper} ref={profileRef}>
                    <button
                        className={styles.profileBtn}
                        onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                    >
                        <div className={styles.profileAvatar}>
                            {profileImage
                                ? <img src={profileImage} alt={user?.name} className={styles.avatarImg} />
                                : (user?.name?.charAt(0)?.toUpperCase() || 'U')
                            }
                        </div>
                    </button>

                    {showProfileMenu && (
                        <div className={styles.profileDropdown}>
                            <div className={styles.profileInfo}>
                                <div className={styles.profileAvatarLg}>
                                    {profileImage
                                        ? <img src={profileImage} alt={user?.name} className={styles.avatarImg} />
                                        : (user?.name?.charAt(0)?.toUpperCase() || 'U')
                                    }
                                </div>
                                <div>
                                    <span className={styles.profileName}>{user?.name || 'User'}</span>
                                    <span className={styles.profileEmail}>{user?.email || ''}</span>
                                </div>
                            </div>
                            <div className={styles.profileMenuItems}>
                                <button onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}>
                                    <MdPerson /> View Profile
                                </button>
                                <button onClick={handleLogout} className={styles.logoutItem}>
                                    <MdLogout /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
