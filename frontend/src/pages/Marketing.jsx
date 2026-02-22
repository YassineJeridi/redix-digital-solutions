import React from 'react';
import MarketingProjectsList from '../components/Marketing/MarketingProjectsList';
import styles from './Marketing.module.css';

const Marketing = () => {
    return (
        <div className={styles.page}>
            <h1 className={styles.pageTitle}>Marketing Projects</h1>
            <MarketingProjectsList />
        </div>
    );
};

export default Marketing;
