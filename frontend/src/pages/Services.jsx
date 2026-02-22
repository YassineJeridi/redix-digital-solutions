import React from 'react';
import ServicesList from '../components/Services/ServicesList';
import styles from './Services.module.css';

const Services = () => {
    return (
        <div className={styles.page}>
            <h1 className={styles.pageTitle}>Service Management</h1>
            <ServicesList />
        </div>
    );
};

export default Services;


