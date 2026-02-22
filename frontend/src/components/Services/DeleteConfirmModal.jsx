import React, { useState } from 'react';
import { MdClose, MdWarning } from 'react-icons/md';
import styles from './DeleteConfirmModal.module.css';

const DeleteConfirmModal = ({ project, onConfirm, onCancel }) => {
    const [confirmName, setConfirmName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (confirmName !== project.projectName) {
            setError('Project name does not match');
            return;
        }

        setLoading(true);
        try {
            await onConfirm(confirmName);
        } catch (err) {
            setError(err.response?.data?.message || 'Error deleting project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.iconWarning}>
                        <MdWarning />
                    </div>
                    <h2>Delete Project</h2>
                    <button className={styles.closeBtn} onClick={onCancel}>
                        <MdClose />
                    </button>
                </div>

                <div className={styles.content}>
                    <p className={styles.warning}>
                        <span>
                            <strong>Warning: This action cannot be undone.</strong>
                            This will permanently delete the project and all associated data including notes, attachments, and audit logs.
                        </span>
                    </p>

                    <div className={styles.projectInfo}>
                        <div className={styles.projectInfoRow}>
                            <span className={styles.infoLabel}>Project</span>
                            <span className={styles.infoValue}>{project.projectName}</span>
                        </div>
                        <div className={styles.projectInfoRow}>
                            <span className={styles.infoLabel}>Client</span>
                            <span className={styles.infoValue}>{project.client?.businessName || 'N/A'}</span>
                        </div>
                        <div className={styles.projectInfoRow}>
                            <span className={styles.infoLabel}>Total</span>
                            <span className={styles.infoValue}>{project.totalPrice?.toLocaleString()} TND</span>
                        </div>
                    </div>

                    <div className={styles.confirmSection}>
                        <label htmlFor="confirmName">
                            To confirm deletion, type the project name exactly as shown below:
                        </label>
                        <div className={styles.projectNameDisplay}>
                            {project.projectName}
                        </div>
                        <input
                            id="confirmName"
                            type="text"
                            value={confirmName}
                            onChange={(e) => {
                                setConfirmName(e.target.value);
                                setError('');
                            }}
                            placeholder="Type project name here"
                            className={styles.input}
                            autoFocus
                        />
                        {error && <p className={styles.error}>{error}</p>}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onCancel}>
                        Cancel
                    </button>
                    <button 
                        className={styles.deleteBtn} 
                        onClick={handleConfirm}
                        disabled={loading || confirmName !== project.projectName}
                    >
                        {loading ? 'Deleting...' : 'Delete Project'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
