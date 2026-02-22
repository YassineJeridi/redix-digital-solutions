import React from 'react';
import styles from './FinancialCard.module.css';

const FinancialCard = ({ title, value, tooltip, icon }) => {
    return (
        <div className={styles.card} title={tooltip}>
            <div className={styles.header}>
                <h3>{title}</h3>
                {icon}
            </div>
            <p className={styles.value}>${value?.toLocaleString()}</p>
            <div className={styles.tooltip}>{tooltip}</div>
        </div>
    );
};

export default FinancialCard;
