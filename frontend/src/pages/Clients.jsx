import React from 'react';
import ClientsList from '../components/Clients/ClientsList';
import styles from './Clients.module.css';

const Clients = () => {
    return (
        <div className={styles.page}>
            <h1 className={styles.pageTitle}>Clients Management</h1>
            <ClientsList />
        </div>
    );
};

export default Clients;
