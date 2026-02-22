import React from 'react';
import styles from './MetricCard.module.css';

const MetricCard = ({ title, value, icon, color }) => {
    return (
        <div className={`${styles.card} ${styles[color]}`}>
            <div className={styles.icon}>{icon}</div>
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.value}>{value}</p>
            </div>
        </div>
    );
};

export default MetricCard;
