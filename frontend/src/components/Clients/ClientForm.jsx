import React, { useState } from 'react';
import { MdClose, MdUpload, MdPerson } from 'react-icons/md';
import imageCompression from 'browser-image-compression';
import styles from './ClientForm.module.css';

const ClientForm = ({ onSubmit, onClose, editData = null, customTypes = [] }) => {
    const [formData, setFormData] = useState({
        businessName: editData?.businessName || '',
        ownerName: editData?.ownerName || '',
        email: editData?.email || '',
        phone: editData?.phone || '',
        address: editData?.address || '',
        profileImage: editData?.profileImage || '',
        matriculeFiscale: editData?.matriculeFiscale || '',
        businessType: editData?.businessType || '',
        customBusinessType: editData?.customBusinessType || '',
        notes: editData?.notes || ''
    });

    const [imagePreview, setImagePreview] = useState(editData?.profileImage || '');
    const [isCompressing, setIsCompressing] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                    setFormData(prev => ({ ...prev, profileImage: reader.result }));
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
                    <h2>{editData ? 'Edit Client' : 'Add New Client'}</h2>
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
                                    setFormData(prev => ({ ...prev, profileImage: '' }));
                                }}
                            >
                                Remove Photo
                            </button>
                        )}
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Business Name *</label>
                            <input
                                type="text"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                placeholder="Enter business name"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Owner Name *</label>
                            <input
                                type="text"
                                name="ownerName"
                                value={formData.ownerName}
                                onChange={handleChange}
                                placeholder="Enter owner name"
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
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Phone *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+216 XX XXX XXX"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter address"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Matricule Fiscale</label>
                        <input
                            type="text"
                            name="matriculeFiscale"
                            value={formData.matriculeFiscale}
                            onChange={handleChange}
                            placeholder="e.g. 1234567ABC"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Business Type</label>
                        <select
                            name="businessType"
                            value={
                                formData.businessType === 'Others' && formData.customBusinessType && customTypes.includes(formData.customBusinessType)
                                    ? `custom:${formData.customBusinessType}`
                                    : formData.businessType
                            }
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val.startsWith('custom:')) {
                                    const custom = val.slice(7);
                                    setFormData(prev => ({ ...prev, businessType: 'Others', customBusinessType: custom }));
                                } else {
                                    setFormData(prev => ({ ...prev, businessType: val, customBusinessType: val === 'Others' ? prev.customBusinessType : '' }));
                                }
                            }}
                        >
                            <option value="">Select type…</option>
                            <option value="Restaurant">Restaurant</option>
                            <option value="E-Commerce">E-Commerce</option>
                            {customTypes.map(type => (
                                <option key={type} value={`custom:${type}`}>{type}</option>
                            ))}
                            <option value="Others">Others (new type…)</option>
                        </select>
                    </div>

                    {formData.businessType === 'Others' && !customTypes.includes(formData.customBusinessType) && (
                        <div className={styles.formGroup}>
                            <label>Specify Business Type *</label>
                            <input
                                type="text"
                                name="customBusinessType"
                                value={formData.customBusinessType}
                                onChange={handleChange}
                                placeholder="e.g. Consulting, Healthcare…"
                                required
                            />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Additional notes about the client"
                            rows="4"
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={isCompressing}>
                            {editData ? 'Update Client' : 'Add Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientForm;
