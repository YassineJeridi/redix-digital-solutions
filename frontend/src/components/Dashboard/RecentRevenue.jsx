import React from 'react';
import styles from './RecentRevenue.module.css';

const RecentRevenue = ({ services }) => {
    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Recent Revenues</h3>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>service</th>
                            <th>Client</th>
                            <th>Category</th>
                            <th>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services?.slice(0, 5).map((service, index) => (
                            <tr key={index} className={styles.row}>
                                <td>{service.name}</td>
                                <td>{service.client}</td>
                                <td>
                                    <span className={`${styles.badge} ${styles[service.category]}`}>
                                        {service.category}
                                    </span>
                                </td>
                                <td className={styles.revenue}>${service.revenue?.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentRevenue;

