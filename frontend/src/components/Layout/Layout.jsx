import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

    const handleToggle = () => {
        setCollapsed(c => {
            localStorage.setItem('sidebarCollapsed', String(!c));
            return !c;
        });
    };

    return (
        <div className={styles.layout}>
            <Sidebar collapsed={collapsed} onToggle={handleToggle} />
            <div className={`${styles.main} ${collapsed ? styles.collapsedMain : ''}`}>
                <Navbar />
                <div className={styles.content}>{children}</div>
            </div>
        </div>
    );
};

export default Layout;
