import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    MdDashboard,
    MdPeople,
    MdWork,
    MdAttachMoney,
    MdSettings,
    MdBuild,
    MdTrendingUp,
    MdAssessment,
    MdGroup,
    MdLogout,
    MdHistory,
    MdAssignment,
    MdBackup,
    MdExpandMore,
    MdExpandLess,
    MdReceiptLong,
    MdChevronLeft,
    MdChevronRight,
    MdFactCheck,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import redixLogo from '../../assets/redix_logo.png';
import styles from './Sidebar.module.css';

const menuSections = [
    {
        label: 'MAIN',
        collapsible: false,
        items: [
            { text: 'Overview', icon: <MdDashboard />, path: '/overview' },
        ],
    },
    {
        label: 'WORK MANAGEMENT',
        collapsible: true,
        items: [
            { text: 'Services', icon: <MdWork />, path: '/services' },
            { text: 'Tasks', icon: <MdAssignment />, path: '/tasks' },
            { text: 'Clients', icon: <MdPeople />, path: '/clients' },
            { text: 'Invoice Status', icon: <MdFactCheck />, path: '/work/invoice-status' },
        ],
    },
    {
        label: 'FINANCE & ASSETS',
        collapsible: true,
        items: [
            { text: 'Invoices', icon: <MdReceiptLong />, path: '/finance/invoices' },
            { text: 'Expenses', icon: <MdAttachMoney />, path: '/expenses' },
            { text: 'Investing', icon: <MdTrendingUp />, path: '/investing' },
            { text: 'Tools', icon: <MdBuild />, path: '/tools' },
        ],
    },
    {
        label: 'TEAM & INSIGHTS',
        collapsible: true,
        items: [
            { text: 'Team', icon: <MdGroup />, path: '/team' },
            { text: 'Reports', icon: <MdAssessment />, path: '/reports' },
            { text: 'Activity Log', icon: <MdHistory />, path: '/activity' },
        ],
    },
    {
        label: 'SYSTEM',
        collapsible: true,
        defaultCollapsed: true,
        items: [
            { text: 'Backup', icon: <MdBackup />, path: '/backup' },
            { text: 'Settings', icon: <MdSettings />, path: '/settings' },
        ],
    },
];

const Sidebar = ({ collapsed, onToggle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Initialize collapsedSections: SYSTEM is collapsed by default
    const [collapsedSections, setCollapsedSections] = useState(() => {
        const initial = {};
        menuSections.forEach(s => {
            if (s.defaultCollapsed) initial[s.label] = true;
        });
        return initial;
    });

    const toggleSection = (label) => {
        if (collapsed) return;
        setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavClick = () => {};

    return (
        <>
            <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
                <div className={styles.logoRow}>
                    {!collapsed && (
                        <img src={redixLogo} alt="Redix" className={styles.logoImg} />
                    )}
                    <button
                        className={styles.toggleBtn}
                        onClick={onToggle}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
                    </button>
                </div>

                <nav className={styles.nav}>
                    {menuSections.map((section) => {
                        const isSectionCollapsed = section.collapsible && collapsedSections[section.label];
                        return (
                            <div key={section.label} className={styles.section}>
                                {!collapsed && (
                                    section.collapsible ? (
                                        <button
                                            className={styles.sectionLabelBtn}
                                            onClick={() => toggleSection(section.label)}
                                        >
                                            <span>{section.label}</span>
                                            {isSectionCollapsed ? <MdExpandMore className={styles.chevron} /> : <MdExpandLess className={styles.chevron} />}
                                        </button>
                                    ) : (
                                        <span className={styles.sectionLabel}>{section.label}</span>
                                    )
                                )}
                                {(!isSectionCollapsed || collapsed) && (
                                    <div className={styles.sectionItems}>
                                        {section.items.map((item) => (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                onClick={handleNavClick}
                                                title={collapsed ? item.text : undefined}
                                                className={({ isActive }) =>
                                                    `${styles.navItem} ${isActive ? styles.active : ''} ${collapsed ? styles.navItemCollapsed : ''}`
                                                }
                                            >
                                                <span className={styles.icon}>{item.icon}</span>
                                                {!collapsed && <span className={styles.text}>{item.text}</span>}
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className={`${styles.sidebarFooter} ${collapsed ? styles.sidebarFooterCollapsed : ''}`}>
                    {user && !collapsed && (
                        <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className={styles.userDetails}>
                                <span className={styles.userName}>{user.name || 'User'}</span>
                                <span className={styles.userRole}>{user.role || 'member'}</span>
                            </div>
                        </div>
                    )}
                    {user && collapsed && (
                        <div className={styles.avatarOnly} title={user.name}>
                            <div className={styles.userAvatar}>
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        </div>
                    )}
                    <button
                        className={`${styles.logoutBtn} ${collapsed ? styles.logoutBtnCollapsed : ''}`}
                        onClick={handleLogout}
                        title={collapsed ? 'Logout' : undefined}
                    >
                        <MdLogout />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
