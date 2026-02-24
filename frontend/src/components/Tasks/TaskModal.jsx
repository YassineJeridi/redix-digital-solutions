import React, { useState, useEffect, useRef } from 'react';
import {
    MdClose, MdSave, MdDelete, MdSend, MdPerson,
    MdFlag, MdCalendarToday, MdBusinessCenter,
    MdViewColumn, MdDescription, MdComment,
    MdChecklist, MdAdd, MdCheckBox, MdCheckBoxOutlineBlank,
    MdLowPriority, MdWarning, MdPriorityHigh,
    MdCreate, MdEdit, MdPersonAdd, MdSwapHoriz, MdHistory,
    MdAutorenew, MdDeleteOutline
} from 'react-icons/md';
import { getAuditLogs } from '../../services/AuditServices';
import styles from './TaskModal.module.css';

const priorityIcons = {
    Low: <MdLowPriority style={{ color: '#10b981' }} />,
    Medium: <MdWarning style={{ color: '#f59e0b' }} />,
    High: <MdPriorityHigh style={{ color: '#ef4444' }} />,
};

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
    defaultStatus = 'Todo',
    defaultAssignees = []
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'Medium',
        client: '',
        assignedTo: defaultAssignees,
        dueDate: '',
        attachments: [],
        checklist: []
    });
    const [commentText, setCommentText] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
    const [newCheckItem, setNewCheckItem] = useState('');
    const [activityLogs, setActivityLogs] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const assigneeRef = useRef(null);
    const commentInputRef = useRef(null);
    const checkItemRef = useRef(null);

    const isEditing = !!task?._id;

    // Reset / populate form when modal opens or task changes
    useEffect(() => {
        if (!isOpen) return;
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'Todo',
                priority: task.priority || 'Medium',
                client: task.client?._id || task.client || '',
                assignedTo: (task.assignedTo || []).map(m => m._id || m),
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                attachments: task.attachments || [],
                checklist: (task.checklist || []).map(item => ({
                    _id: item._id,
                    text: item.text,
                    done: item.done || false
                }))
            });
        } else {
            setFormData({
                title: '',
                description: '',
                status: defaultStatus,
                priority: 'Medium',
                client: '',
                assignedTo: defaultAssignees,
                dueDate: '',
                attachments: [],
                checklist: []
            });
        }
        setCommentText('');
        setNewCheckItem('');
    }, [isOpen, task, defaultStatus, defaultAssignees]);

    // Fetch activity log for existing tasks
    useEffect(() => {
        if (!task?._id) { setActivityLogs([]); return; }
        setLoadingActivity(true);
        getAuditLogs({ entityType: 'Task', entityId: task._id, limit: 20 })
            .then(data => setActivityLogs(data.logs || []))
            .catch(() => setActivityLogs([]))
            .finally(() => setLoadingActivity(false));
    }, [task?._id]);

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

    // ── Checklist handlers ──────────────────────────────
    const addChecklistItem = () => {
        const text = newCheckItem.trim();
        if (!text) return;
        setFormData(prev => ({
            ...prev,
            checklist: [...prev.checklist, { text, done: false }]
        }));
        setNewCheckItem('');
        checkItemRef.current?.focus();
    };

    const toggleChecklistItem = (index) => {
        setFormData(prev => ({
            ...prev,
            checklist: prev.checklist.map((item, i) =>
                i === index ? { ...item, done: !item.done } : item
            )
        }));
    };

    const removeChecklistItem = (index) => {
        setFormData(prev => ({
            ...prev,
            checklist: prev.checklist.filter((_, i) => i !== index)
        }));
    };

    const doneCount = formData.checklist.filter(i => i.done).length;
    const totalCount = formData.checklist.length;
    const checkProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    // ── Save / Delete / Comment ─────────────────────────
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

    const handleCommentKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddComment();
        }
    };

    const selectedMembers = teamMembers.filter(m => formData.assignedTo.includes(m._id));

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerLeft}>
                        <h2>{isEditing ? 'Edit Task' : 'New Task'}</h2>
                    </div>
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
                                rows={3}
                            />
                        </div>

                        {/* Checklist */}
                        <div className={styles.formGroup}>
                            <label>
                                <MdChecklist size={15} /> Checklist
                                {totalCount > 0 && (
                                    <span className={styles.checklistCount}>{doneCount}/{totalCount}</span>
                                )}
                            </label>

                            {totalCount > 0 && (
                                <div className={styles.checkProgressBar}>
                                    <div
                                        className={styles.checkProgressFill}
                                        style={{ width: `${checkProgress}%` }}
                                    />
                                    <span className={styles.checkProgressText}>{checkProgress}%</span>
                                </div>
                            )}

                            <div className={styles.checklistItems}>
                                {formData.checklist.map((item, index) => (
                                    <div key={index} className={`${styles.checklistItem} ${item.done ? styles.checklistDone : ''}`}>
                                        <button
                                            type="button"
                                            className={styles.checkboxBtn}
                                            onClick={() => toggleChecklistItem(index)}
                                        >
                                            {item.done
                                                ? <MdCheckBox size={18} style={{ color: '#10b981' }} />
                                                : <MdCheckBoxOutlineBlank size={18} style={{ color: '#6b7280' }} />
                                            }
                                        </button>
                                        <span className={styles.checklistText}>{item.text}</span>
                                        <button
                                            type="button"
                                            className={styles.removeCheckBtn}
                                            onClick={() => removeChecklistItem(index)}
                                        >
                                            <MdClose size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.addChecklistRow}>
                                <input
                                    ref={checkItemRef}
                                    type="text"
                                    value={newCheckItem}
                                    onChange={(e) => setNewCheckItem(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
                                    placeholder="Add a checklist item..."
                                    className={styles.checklistInput}
                                />
                                <button
                                    type="button"
                                    className={styles.addCheckBtn}
                                    onClick={addChecklistItem}
                                    disabled={!newCheckItem.trim()}
                                >
                                    <MdAdd size={16} />
                                </button>
                            </div>
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
                                                            month: 'short', day: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
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
                                        onKeyDown={handleCommentKeyDown}
                                        placeholder="Write a comment..."
                                    />
                                    <button className={styles.sendBtn} onClick={handleAddComment} disabled={!commentText.trim()}>
                                        <MdSend size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Activity Log (only when editing) */}
                        {isEditing && (
                            <div className={styles.activitySection}>
                                <h4><MdHistory size={15} /> Activity Log</h4>
                                {loadingActivity ? (
                                    <p className={styles.activityLoading}>Loading activity...</p>
                                ) : activityLogs.length === 0 ? (
                                    <p className={styles.noActivity}>No activity recorded yet</p>
                                ) : (
                                    <div className={styles.activityList}>
                                        {activityLogs.map((log, i) => (
                                            <div key={log._id || i} className={styles.activityItem}>
                                                <div className={styles.activityIcon}>
                                                    {log.action === 'create' && <MdCreate size={14} style={{ color: '#10b981' }} />}
                                                    {log.action === 'update' && <MdEdit size={14} style={{ color: '#6366f1' }} />}
                                                    {log.action === 'team_assignment' && <MdPersonAdd size={14} style={{ color: '#f59e0b' }} />}
                                                    {log.action === 'status_change' && <MdSwapHoriz size={14} style={{ color: '#3b82f6' }} />}
                                                    {log.action === 'delete' && <MdDeleteOutline size={14} style={{ color: '#ef4444' }} />}
                                                    {!['create','update','team_assignment','status_change','delete'].includes(log.action) && <MdAutorenew size={14} style={{ color: '#9ca3af' }} />}
                                                </div>
                                                <div className={styles.activityContent}>
                                                    <span className={styles.activityAction}>
                                                        {log.action.replace(/_/g, ' ')}
                                                    </span>
                                                    {log.userName && (
                                                        <span className={styles.activityBy}> by {log.userName}</span>
                                                    )}
                                                    {log.details?.from && log.details?.to && (
                                                        <span className={styles.activityDetail}>
                                                            {' '}{log.details.from} → {log.details.to}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={styles.activityTime}>
                                                    {new Date(log.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Side fields */}
                    <div className={styles.sideSection}>
                        {/* Status */}
                        <div className={styles.sideField}>
                            <label><MdViewColumn size={14} /> Status</label>
                            <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Priority */}
                        <div className={styles.sideField}>
                            <label><MdFlag size={14} /> Priority</label>
                            <div className={styles.priorityButtons}>
                                {['Low', 'Medium', 'High'].map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        className={`${styles.priorityBtn} ${formData.priority === p ? styles.priorityActive : ''}`}
                                        data-priority={p.toLowerCase()}
                                        onClick={() => handleChange('priority', p)}
                                    >
                                        {priorityIcons[p]} {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Client */}
                        <div className={styles.sideField}>
                            <label><MdBusinessCenter size={14} /> Client</label>
                            <select value={formData.client} onChange={(e) => handleChange('client', e.target.value)}>
                                <option value="">No client</option>
                                {clients.map(c => (
                                    <option key={c._id} value={c._id}>{c.businessName || c.ownerName}</option>
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
                            <div className={styles.assigneeSelect} onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}>
                                {selectedMembers.length === 0 ? (
                                    <span className={styles.placeholder}>Select members...</span>
                                ) : (
                                    <div className={styles.selectedMembers}>
                                        {selectedMembers.map(m => (
                                            <span key={m._id} className={styles.memberChip}>
                                                <span className={styles.chipAvatar}>
                                                    {m.profileImage
                                                        ? <img src={m.profileImage} alt={m.name} />
                                                        : m.name?.charAt(0)?.toUpperCase()
                                                    }
                                                </span>
                                                {m.name}
                                                <button className={styles.chipRemove} onClick={(e) => { e.stopPropagation(); toggleAssignee(m._id); }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {showAssigneeDropdown && (
                                <div className={styles.assigneeDropdown}>
                                    {teamMembers.map(m => (
                                        <label key={m._id} className={`${styles.assigneeOption} ${formData.assignedTo.includes(m._id) ? styles.assigneeSelected : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={formData.assignedTo.includes(m._id)}
                                                onChange={() => toggleAssignee(m._id)}
                                            />
                                            <div className={styles.optionAvatar}>
                                                {m.profileImage
                                                    ? <img src={m.profileImage} alt={m.name} className={styles.optionAvatarImg} />
                                                    : m.name?.charAt(0)?.toUpperCase() || '?'
                                                }
                                            </div>
                                            <div className={styles.optionInfo}>
                                                <span>{m.name}</span>
                                                <small>{m.role}</small>
                                            </div>
                                            {formData.assignedTo.includes(m._id) && (
                                                <span className={styles.checkmark}>✓</span>
                                            )}
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
                        <button className={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
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
                            <MdSave size={16} /> {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default TaskModal;
