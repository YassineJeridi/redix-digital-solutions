import React from 'react';
import { MdEmail, MdPhone, MdLocationOn, MdAttachMoney } from 'react-icons/md';
import styles from './ClientCard.module.css';

const ClientCard = ({ client }) => {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.businessName}>{client.businessName}</h3>
                <div className={styles.revenue}>
                    <MdAttachMoney />
                    ${client.revenue?.toLocaleString()}
                </div>
            </div>

            <div className={styles.info}>
                <p className={styles.ownerName}>{client.ownerName}</p>

                <div className={styles.contact}>
                    <div className={styles.contactItem}>
                        <MdEmail />
                        <span>{client.email}</span>
                    </div>
                    <div className={styles.contactItem}>
                        <MdPhone />
                        <span>{client.phone}</span>
                    </div>
                    {client.address && (
                        <div className={styles.contactItem}>
                            <MdLocationOn />
                            <span>{client.address}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientCard;
