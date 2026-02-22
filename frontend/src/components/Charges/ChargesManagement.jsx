import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdWarning, MdCheckCircle } from 'react-icons/md';
import ChargeForm from './ChargeForm';
import * as ChargesService from '../../services/ChargesServices';
import * as FinancialService from '../../services/FinancialServices';
import styles from './ChargesManagement.module.css';

const ChargesManagement = () => {
    const [charges, setCharges] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCharge, setEditingCharge] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [chargesData, metricsData] = await Promise.all([
                ChargesService.getCharges(),
                FinancialService.getFinancialMetrics()
            ]);
            setCharges(chargesData);
            setMetrics(metricsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleAddCharge = async (chargeData) => {
        try {
            const response = await ChargesService.createCharge(chargeData);
            setMetrics(response.metrics);
            fetchData();
            setShowForm(false);
        } catch (error) {
            console.error('Error creating charge:', error);
            alert('Failed to create charge. Please try again.');
        }
    };

    const handleUpdateCharge = async (chargeData) => {
        try {
            const response = await ChargesService.updateCharge(editingCharge._id, chargeData);
            setMetrics(response.metrics);
            fetchData();
            setEditingCharge(null);
            setShowForm(false);
        } catch (error) {
            console.error('Error updating charge:', error);
            alert('Failed to update charge. Please try again.');
        }
    };

    const handleDeleteCharge = async (chargeId) => {
        if (window.confirm('Are you sure you want to delete this charge?')) {
            try {
                const response = await ChargesService.deleteCharge(chargeId);
                setMetrics(response.metrics);
                fetchData();
            } catch (error) {
                console.error('Error deleting charge:', error);
                alert('Failed to delete charge. Please try again.');
            }
        }
    };

    const handleEditClick = (charge) => {
        setEditingCharge(charge);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingCharge(null);
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Internet': '#3B82F6',
            'Transport': '#10B981',
            'Utilities': '#F59E0B',
            'Rent': '#EF4444',
            'Supplies': '#8B5CF6',
            'Equipment': '#EC4899',
            'Marketing': '#6366F1',
            'Other': '#6B7280'
        };
        return colors[category] || '#6B7280';
    };

    const totalCharges = charges.reduce((sum, charge) => sum + charge.amount, 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.caisseSummary}>
                    <div className={styles.caisseCard}>
                        <div className={styles.caisseIcon}>
                            <MdCheckCircle />
                        </div>
                        <div>
                            <span className={styles.caisseLabel}>Redix Caisse</span>
                            <span className={styles.caisseAmount}>
                                {metrics?.redixCaisse?.toFixed(2) || '0.00'} TND
                            </span>
                        </div>
                    </div>

                    <div className={styles.caisseCard}>
                        <div className={styles.caisseIcon}>
                            <MdWarning />
                        </div>
                        <div>
                            <span className={styles.caisseLabel}>Total Expenses</span>
                            <span className={styles.expenseAmount}>
                                {totalCharges.toFixed(2)} TND
                            </span>
                        </div>
                    </div>
                </div>

                <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                    <MdAdd /> Add Charge
                </button>
            </div>

            {showForm && (
                <ChargeForm
                    onSubmit={editingCharge ? handleUpdateCharge : handleAddCharge}
                    onClose={handleCloseForm}
                    editData={editingCharge}
                    currentCaisse={metrics?.redixCaisse || 0}
                />
            )}

            <div className={styles.chargesList}>
                {charges.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No charges recorded yet. Add your first charge!</p>
                    </div>
                ) : (
                    charges.map((charge) => (
                        <div key={charge._id} className={styles.chargeCard}>
                            <div
                                className={styles.categoryStripe}
                                style={{ background: getCategoryColor(charge.category) }}
                            />

                            <div className={styles.cardContent}>
                                <div className={styles.chargeHeader}>
                                    <div>
                                        <h3>{charge.name}</h3>
                                        <span
                                            className={styles.category}
                                            style={{ color: getCategoryColor(charge.category) }}
                                        >
                                            {charge.category}
                                        </span>
                                    </div>
                                    <div className={styles.actions}>
                                        <button onClick={() => handleEditClick(charge)} className={styles.editBtn}>
                                            <MdEdit />
                                        </button>
                                        <button onClick={() => handleDeleteCharge(charge._id)} className={styles.deleteBtn}>
                                            <MdDelete />
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.chargeBody}>
                                    {charge.description && (
                                        <p className={styles.description}>{charge.description}</p>
                                    )}

                                    <div className={styles.chargeInfo}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Amount</span>
                                            <span className={styles.amount}>{charge.amount?.toFixed(2)} TND</span>
                                        </div>

                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Frequency</span>
                                            <span className={styles.frequency}>{charge.frequency}</span>
                                        </div>

                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Date</span>
                                            <span className={styles.date}>
                                                {new Date(charge.date).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Status</span>
                                            <span className={`${styles.status} ${styles[charge.status]}`}>
                                                {charge.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChargesManagement;
