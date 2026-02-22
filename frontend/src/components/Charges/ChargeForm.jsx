import React, { useState } from 'react';
import { MdClose, MdWarning } from 'react-icons/md';
import styles from './ChargeForm.module.css';

const CATEGORIES = [
    'Internet',
    'Transport',
    'Utilities',
    'Rent',
    'Supplies',
    'Equipment',
    'Marketing',
    'Other'
];

const ChargeForm = ({ onSubmit, onClose, editData = null, currentCaisse = 0 }) => {
    const [formData, setFormData] = useState({
        name: editData?.name || '',
        amount: editData?.amount || '',
        category: editData?.category || 'Internet',
        description: editData?.description || '',
        frequency: editData?.frequency || 'one-time',
        date: editData?.date ? new Date(editData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: editData?.status || 'paid'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (Number(formData.amount) > currentCaisse) {
            alert(`Insufficient funds in Redix Caisse. Available: ${currentCaisse.toFixed(2)} TND`);
            return;
        }

        onSubmit(formData);
    };

    const remainingBalance = currentCaisse - Number(formData.amount || 0);

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{editData ? 'Edit Charge' : 'Add New Charge'}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <MdClose />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.balanceInfo}>
                        <div className={styles.balanceItem}>
                            <span className={styles.balanceLabel}>Current Caisse</span>
                            <span className={styles.balanceValue}>{currentCaisse.toFixed(2)} TND</span>
                        </div>
                        {formData.amount && (
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>After Charge</span>
                                <span className={`${styles.balanceValue} ${remainingBalance < 0 ? styles.negative : ''}`}>
                                    {remainingBalance.toFixed(2)} TND
                                </span>
                            </div>
                        )}
                    </div>

                    {remainingBalance < 0 && (
                        <div className={styles.warningBox}>
                            <MdWarning />
                            <span>Insufficient funds in Redix Caisse!</span>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>Charge Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Monthly Internet Bill"
                            required
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Amount (TND) *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Additional details about this charge"
                            rows="3"
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Frequency *</label>
                            <select
                                name="frequency"
                                value={formData.frequency}
                                onChange={handleChange}
                                required
                            >
                                <option value="one-time">One-time</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Date *</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Status *</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                        >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={remainingBalance < 0}
                        >
                            {editData ? 'Update Charge' : 'Add Charge'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChargeForm;
