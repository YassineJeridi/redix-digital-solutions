import React from 'react';
import ToolsList from '../components/Tools/ToolsList';
import styles from './Tools.module.css';

const Tools = () => {
    return (
        <div className={styles.page}>
            <ToolsList />
        </div>
    );
};

export default Tools;
