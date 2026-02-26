import React, { useState } from 'react';
import { MdBuild, MdAutoAwesome } from 'react-icons/md';
import ToolsList from '../components/Tools/ToolsList';
import UpgradeSection from '../components/Tools/UpgradeSection';
import styles from './Tools.module.css';

const TABS = [
    { id: 'tools',   label: 'Finance & Assets', icon: <MdBuild /> },
    { id: 'upgrade', label: 'Upgrade',            icon: <MdAutoAwesome /> },
];

const Tools = () => {
    const [activeTab, setActiveTab] = useState('tools');

    return (
        <div className={styles.page}>
            <div className={styles.tabBar}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(t.id)}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>
            <div className={styles.tabContent}>
                {activeTab === 'tools'   && <ToolsList />}
                {activeTab === 'upgrade' && <UpgradeSection />}
            </div>
        </div>
    );
};

export default Tools;
