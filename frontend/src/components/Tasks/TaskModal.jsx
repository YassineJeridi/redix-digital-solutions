import React, { useState, useEffect, useRef } from 'react';
import {
    MdClose, MdSave, MdDelete, MdSend, MdPerson,
    MdFlag, MdCalendarToday, MdBusinessCenter,
    MdViewColumn, MdDescription, MdComment
} from 'react-icons/md';
import styles from './TaskModal.module.css';

const TaskModal = ({
    isOpen,
    task,
    clients,
    teamMembers,
    statuses = ['Todo', 'Doing', 'Done'],
    onSave,
    onDelete,
    onAddComment,
    onClose,
    defaultStatus = 'Todo'
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'Medium',
        client: '',
        assignedTo: [],
        dueDate: '',
        attachments: []
    });
    const [commentText, setCommentText] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
    const assigneeRef = useRef(null);
    const commentInputRef = useRef(null);

    const isEditing = !!task?._id;

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'Todo',
                priority: task.priority || 'Medium',
                client: task.client?._id || task.client || '',
                assignedTo: (task.assignedTo || []).map(m => m._id || m),
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                attachments: task.attachments || []
            });
        } else {
            setFormData(f => ({ ...f, status: defaultStatus }));
        }
    }, [task, defaultStatus]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
                setShowAssigneeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleAssignee = (memberId) => {
        setFormData(prev => ({
            ...prev,
            assignedTo: prev.assignedTo.includes(memberId)
                ? prev.assignedTo.filter(id => id !== memberId)
                : [...prev.assignedTo, memberId]
        }));
    };

    const handleSave = async () => {
        if (!formData.title.trim()) return;
        setSaving(true);
        try {
            await onSave({
                ...formData,
                client: formData.client || undefined,
                dueDate: formData.dueDate || undefined
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        setDeleting(true);
        try {
            await onDelete(task._id);
        } finally {
            setDeleting(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        await onAddComment(task._id, commentText.trim());
        setCommentText('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddComment();
        }
    };

    const selectedMembers = teamMembers.filter(m => formData.assignedTo.includes(m._id));

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2>{isEditing ? 'Edit Task' : 'New Task'}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <MdClose size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Left: Main content */}
                    <div className={styles.mainSection}>
                        {/* Title */}
                        <div className={styles.formGroup}>
                            <label><MdDescription size={15} /> Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Task title..."
                                className={styles.titleInput}
                                autoFocus
                            />
                        </div>

                        {/* Description */}
                        <div className={styles.formGroup}>
                            <label><MdDescription size={15} /> Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Add a detailed description..."
                                className={styles.textarea}
                                rows={4}
                            />
                        </div>

                        {/* Comments section (only when editing) */}
                        {isEditing && (
                            <div className={styles.commentsSection}>
                                <h4><MdComment size={15} /> Comments</h4>
                                <div className={styles.commentsList}>
                                    {(task.comments || []).length === 0 && (
                                        <p className={styles.noComments}>No comments yet</p>
                                    )}
                                    {(task.comments || []).slice().reverse().map((c, i) => (
                                        <div key={i} className={styles.commentItem}>
                                            <div className={styles.commentAvatar}>
                                                {c.author?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className={styles.commentContent}>
                                                <div className={styles.commentMeta}>
                                                    <span className={styles.commentAuthor}>{c.author}</span>
                                                    <span className={styles.commentDate}>
                                                        {new Date(c.date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className={styles.commentText}>{c.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.commentInput}>
                                    <input
                                        ref={commentInputRef}
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Write a comment..."
                                    />
                                    <button
                                        className={styles.sendBtn}
                                        onClick={handleAddComment}
                                        disabled={!commentText.trim()}
                                    >
                                        <MdSend size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Side fields */}
                    <div className={styles.sideSection}>
                        {/* Status */}
                        <div className={styles.sideField}>
                            <label><MdViewColumn size={14} /> Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                {statuses.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div className={styles.sideField}>
                            <label><MdFlag size={14} /> Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                            >
                                <option value="Low">🟢 Low</option>
                                <option value="Medium">🟡 Medium</option>
                                <option value="High">🔴 High</option>
                            </select>
                        </div>

                        {/* Client */}
                        <div className={styles.sideField}>
                            <label><MdBusinessCenter size={14} /> Client</label>
                            <select
                                value={formData.client}
                                onChange={(e) => handleChange('client', e.target.value)}
                            >
                                <option value="">No client</option>
                                {clients.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.businessName || c.ownerName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Due date */}
                        <div className={styles.sideField}>
                            <label><MdCalendarToday size={14} /> Due Date</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => handleChange('dueDate', e.target.value)}
                            />
                        </div>

                        {/* Assignees */}
                        <div className={styles.sideField} ref={assigneeRef}>
                            <label><MdPerson size={14} /> Assignees</label>
                            <div
                                className={styles.assigneeSelect}
                                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                            >
                                {selectedMembers.length === 0 ? (
                                    <span className={styles.placeholder}>Select members...</span>
                                ) : (
                                    <div className={styles.selectedMembers}>
                                        {selectedMembers.map(m => (
                                            <span key={m._id} className={styles.memberChip}>
                                                {m.name}
                                                <button
                                                    className={styles.chipRemove}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleAssignee(m._id);
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {showAssigneeDropdown && (
                                <div className={styles.assigneeDropdown}>
                                    {teamMembers.map(m => (
                                        <label key={m._id} className={styles.assigneeOption}>
                                            <input
                                                type="checkbox"
                                                checked={formData.assignedTo.includes(m._id)}
                                                onChange={() => toggleAssignee(m._id)}
                                            />
                                            <div className={styles.optionAvatar}>
                                                {m.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className={styles.optionInfo}>
                                                <span>{m.name}</span>
                                                <small>{m.role}</small>
                                            </div>
                                        </label>
                                    ))}
                                    {teamMembers.length === 0 && (
                                        <p className={styles.noOptions}>No team members</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className={styles.modalFooter}>
                    {isEditing && (
                        <button
                            className={styles.deleteBtn}
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            <MdDelete size={16} /> {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    )}
                    <div className={styles.footerRight}>
                        <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                        <button
                            className={styles.saveBtn}
                            onClick={handleSave}
                            disabled={saving || !formData.title.trim()}
                        >
                            <MdSave size={16} /> {saving ? 'Saving...' : 'Save Task'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
