import React, { useState } from 'react';
import { MdClose, MdUpload, MdPerson } from 'react-icons/md';
import imageCompression from 'browser-image-compression';
import styles from './TeamMemberForm.module.css';

const TeamMemberForm = ({ onSubmit, onClose, editData = null }) => {
    const [formData, setFormData] = useState({
        name: editData?.name || '',
        role: editData?.role || '',
        email: editData?.email || '',
        profileImage: editData?.profileImage || '',
        status: editData?.status || 'active'
    });

    const [imagePreview, setImagePreview] = useState(editData?.profileImage || '');
    const [isCompressing, setIsCompressing] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                setIsCompressing(true);

                // Compression options
                const options = {
                    maxSizeMB: 0.5,          // Max file size 500KB
                    maxWidthOrHeight: 800,    // Max dimension
                    useWebWorker: true
                };

                // Compress the image
                const compressedFile = await imageCompression(file, options);

                // Convert to base64
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                    setFormData({ ...formData, profileImage: reader.result });
                    setIsCompressing(false);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error compressing image:', error);
                alert('Failed to process image. Please try a smaller file.');
                setIsCompressing(false);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{editData ? 'Edit Team Member' : 'Add Team Member'}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <MdClose />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Profile Image Upload */}
                    <div className={styles.imageSection}>
                        <div className={styles.imagePreview}>
                            {isCompressing ? (
                                <div className={styles.spinner}></div>
                            ) : imagePreview ? (
                                <img src={imagePreview} alt="Profile" />
                            ) : (
                                <MdPerson />
                            )}
                        </div>
                        <label className={styles.uploadBtn}>
                            <MdUpload />
                            <span>{isCompressing ? 'Processing...' : 'Upload Photo'}</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                                disabled={isCompressing}
                            />
                        </label>
                        {imagePreview && (
                            <button
                                type="button"
                                className={styles.removeImageBtn}
                                onClick={() => {
                                    setImagePreview('');
                                    setFormData({ ...formData, profileImage: '' });
                                }}
                            >
                                Remove Photo
                            </button>
                        )}
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter name"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Role *</label>
                            <input
                                type="text"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                placeholder="e.g., Video Editor, Designer"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                                required
                                disabled={editData ? true : false}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Status *</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={isCompressing}>
                            {editData ? 'Update Member' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeamMemberForm;
