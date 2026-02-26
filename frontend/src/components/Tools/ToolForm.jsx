import React, { useState } from 'react';
import { MdClose, MdAdd, MdDelete, MdBuild, MdCategory, MdAttachMoney, MdInventory } from 'react-icons/md';
import styles from './ToolForm.module.css';

const ToolForm = ({ onSubmit, onClose, editData = null, existingCategories = [] }) => {
    const [formData, setFormData] = useState({
        name: editData?.name || '',
        basePrice: editData?.basePrice || 0,
        category: editData?.category || '',
        status: editData?.status || 'active',
        subTools: editData?.subTools || []
    });

    const [newSubTool, setNewSubTool] = useState({
        name: '',
        category: '',
        purchasePrice: 0,
        quantity: 1
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const handleAddSubTool = () => {
        const subErrors = {};
        if (!newSubTool.name.trim()) subErrors.subName = true;
        if (!newSubTool.category.trim()) subErrors.subCategory = true;
        if (newSubTool.purchasePrice <= 0) subErrors.subPrice = true;
        if (Object.keys(subErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...subErrors }));
            return;
        }
        setFormData(prev => ({
            ...prev,
            subTools: [...prev.subTools, { ...newSubTool }]
        }));
        setNewSubTool({ name: '', category: '', purchasePrice: 0, quantity: 1 });
        setErrors(prev => ({ ...prev, subName: '', subCategory: '', subPrice: '' }));
    };

    const handleRemoveSubTool = (index) => {
        setFormData(prev => ({
            ...prev,
            subTools: prev.subTools.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Tool name is required';
        if (!formData.category.trim()) newErrors.category = 'Category is required';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const subToolsTotal = formData.subTools.reduce(
            (sum, st) => sum + ((parseFloat(st.purchasePrice) || 0) * (st.quantity || 1)), 0
        );
        const computedPurchasePrice = (parseFloat(formData.basePrice) || 0) + subToolsTotal;

        onSubmit({
            ...formData,
            basePrice: parseFloat(formData.basePrice) || 0,
            purchasePrice: computedPurchasePrice
        });
    };

    const totalInvestment = (parseFloat(formData.basePrice) || 0) + formData.subTools.reduce(
        (sum, st) => sum + ((parseFloat(st.purchasePrice) || 0) * (st.quantity || 1)), 0
    );

    const statusConfig = {
        active: { color: '#22c55e', label: 'Active' },
        maintenance: { color: '#f59e0b', label: 'Maintenance' },
        retired: { color: '#ef4444', label: 'Retired' }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <MdBuild />
                        </div>
                        <div>
                            <h2>{editData ? 'Edit Tool' : 'Add New Tool'}</h2>
                            <p className={styles.headerSub}>
                                {editData ? 'Update tool details below' : 'Fill in the tool details below'}
                            </p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <MdClose />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Tool Name */}
                    <div className={`${styles.formGroup} ${errors.name ? styles.hasError : ''}`}>
                        <label><MdBuild className={styles.fieldIcon} /> Tool Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Canon EOS R5, Rode Mic"
                            className={styles.input}
                        />
                        {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                    </div>

                    {/* Price & Category Row */}
                    <div className={styles.row}>
                        <div className={`${styles.formGroup} ${errors.basePrice ? styles.hasError : ''}`}>
                            <label><MdAttachMoney className={styles.fieldIcon} /> Base Price (TND)</label>
                            <input
                                type="number"
                                name="basePrice"
                                value={formData.basePrice}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className={styles.input}
                            />
                            {errors.basePrice && <span className={styles.errorText}>{errors.basePrice}</span>}
                        </div>

                        <div className={`${styles.formGroup} ${errors.category ? styles.hasError : ''}`}>
                            <label><MdCategory className={styles.fieldIcon} /> Category</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="e.g., Video Equipment"
                                className={styles.input}
                                list="categoryOptions"
                                autoComplete="off"
                            />
                            {existingCategories.length > 0 && (
                                <datalist id="categoryOptions">
                                    {existingCategories.map(c => <option key={c} value={c} />)}
                                </datalist>
                            )}
                            {existingCategories.length > 0 && (
                                <div className={styles.catSuggestions}>
                                    {existingCategories.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`${styles.catChip} ${formData.category === c ? styles.catChipActive : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, category: c }))}
                                        >{c}</button>
                                    ))}
                                </div>
                            )}
                            {errors.category && <span className={styles.errorText}>{errors.category}</span>}
                        </div>
                    </div>

                    {/* Status */}
                    <div className={styles.formGroup}>
                        <label>Status</label>
                        <div className={styles.statusGroup}>
                            {Object.entries(statusConfig).map(([value, config]) => (
                                <label
                                    key={value}
                                    className={`${styles.statusOption} ${formData.status === value ? styles.statusActive : ''}`}
                                    style={formData.status === value ? { borderColor: config.color, background: `${config.color}15` } : {}}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={value}
                                        checked={formData.status === value}
                                        onChange={handleChange}
                                    />
                                    <span className={styles.statusDot} style={{ background: config.color }} />
                                    {config.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Sub Tools Section */}
                    <div className={styles.subToolsSection}>
                        <div className={styles.subToolsHeader}>
                            <h3><MdInventory className={styles.fieldIcon} /> Sub Tools</h3>
                            <span className={styles.subToolsCount}>{formData.subTools.length}</span>
                        </div>

                        <div className={styles.subToolInput}>
                            <div className={styles.subToolFields}>
                                <input
                                    type="text"
                                    placeholder="Sub-tool name"
                                    value={newSubTool.name}
                                    onChange={(e) => setNewSubTool({ ...newSubTool, name: e.target.value })}
                                    className={`${styles.input} ${errors.subName ? styles.inputError : ''}`}
                                />
                                <input
                                    type="text"
                                    placeholder="Category"
                                    value={newSubTool.category}
                                    onChange={(e) => setNewSubTool({ ...newSubTool, category: e.target.value })}
                                    className={`${styles.input} ${errors.subCategory ? styles.inputError : ''}`}
                                />
                                <div className={styles.subToolPriceRow}>
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        value={newSubTool.purchasePrice}
                                        onChange={(e) => setNewSubTool({ ...newSubTool, purchasePrice: Number(e.target.value) })}
                                        min="0"
                                        step="0.01"
                                        className={`${styles.input} ${errors.subPrice ? styles.inputError : ''}`}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={newSubTool.quantity}
                                        onChange={(e) => setNewSubTool({ ...newSubTool, quantity: Math.max(1, Number(e.target.value)) })}
                                        min="1"
                                        className={styles.input}
                                        style={{ maxWidth: '70px' }}
                                    />
                                </div>
                            </div>
                            <button type="button" onClick={handleAddSubTool} className={styles.addSubBtn}>
                                <MdAdd />
                            </button>
                        </div>

                        {formData.subTools.length > 0 && (
                            <div className={styles.subToolsList}>
                                {formData.subTools.map((subTool, index) => (
                                    <div key={index} className={styles.subToolItem}>
                                        <div className={styles.subToolInfo}>
                                            <strong>{subTool.name}</strong>
                                            <span className={styles.subToolMeta}>
                                                {subTool.category} &middot; {subTool.purchasePrice} TND &times; {subTool.quantity || 1}
                                                <span className={styles.subToolTotal}>
                                                    = {(subTool.purchasePrice * (subTool.quantity || 1)).toFixed(2)} TND
                                                </span>
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSubTool(index)}
                                            className={styles.deleteBtn}
                                        >
                                            <MdDelete />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Total Purchase Price (auto-calculated) */}
                    {totalInvestment > 0 && (
                        <div className={styles.totalBar}>
                            <span>Purchase Price (Base + Sub-tools)</span>
                            <strong>{totalInvestment.toFixed(2)} TND</strong>
                        </div>
                    )}

                    {/* Actions */}
                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            {editData ? 'Update Tool' : 'Add Tool'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ToolForm;
