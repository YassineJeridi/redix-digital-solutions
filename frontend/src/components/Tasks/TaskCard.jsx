import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdAccessTime, MdFlag, MdPerson, MdChecklist, MdChatBubble, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import styles from './TaskCard.module.css';

const priorityConfig = {
    High: { color: '#ef4444', label: 'High' },
    Medium: { color: '#f59e0b', label: 'Medium' },
    Low: { color: '#10b981', label: 'Low' }
};

const TaskCard = ({ task, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    const priority = priorityConfig[task.priority] || priorityConfig.Medium;
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

    const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const now = new Date();
        const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        if (diff === -1) return 'Yesterday';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
            onClick={() => onClick(task)}
        >
            {/* Priority bar */}
            <div className={styles.priorityBar} style={{ background: priority.color }} />

            <div className={styles.cardContent}>
                {/* Header row: priority badge + client */}
                <div className={styles.cardHeader}>
                    <span
                        className={styles.priorityBadge}
                        style={{ background: `${priority.color}18`, color: priority.color }}
                    >
                        <MdFlag size={11} /> {priority.label}
                    </span>
                    {task.client && (
                        <span className={styles.clientBadge}>
                            {task.client.businessName || task.client.ownerName}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h4 className={styles.title}>{task.title}</h4>

                {/* Description preview */}
                {task.description && (
                    <p className={styles.description}>
                        {task.description.length > 80
                            ? task.description.substring(0, 80) + '...'
                            : task.description}
                    </p>
                )}

                {/* Footer: assignees + due date */}
                <div className={styles.cardFooter}>
                    {/* Assignee avatars */}
                    <div className={styles.assignees}>
                        {(task.assignedTo || []).slice(0, 3).map((member, i) => (
                            <div
                                key={member._id}
                                className={styles.avatar}
                                style={{ zIndex: 3 - i }}
                                title={member.name}
                            >
                                {member.profileImage
                                    ? <img src={member.profileImage} alt={member.name} className={styles.avatarImg} />
                                    : member.name?.charAt(0)?.toUpperCase() || '?'
                                }
                            </div>
                        ))}
                        {(task.assignedTo || []).length > 3 && (
                            <div className={styles.avatarMore}>
                                +{task.assignedTo.length - 3}
                            </div>
                        )}
                    </div>

                    {/* Due date */}
                    {task.dueDate && (
                        <span className={`${styles.dueDate} ${isOverdue ? styles.overdue : ''}`}>
                            <MdAccessTime size={13} />
                            {formatDate(task.dueDate)}
                        </span>
                    )}
                </div>

                {/* Checklist preview */}
                {task.checklist && task.checklist.length > 0 && (() => {
                    const done = task.checklist.filter(i => i.done).length;
                    const total = task.checklist.length;
                    const pct = Math.round((done / total) * 100);
                    const preview = task.checklist.slice(0, 4);
                    return (
                        <div className={styles.checklistSection}>
                            <div className={styles.checklistRow}>
                                <MdChecklist size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                                <div className={styles.checklistBar}>
                                    <div className={styles.checklistFill} style={{ width: `${pct}%` }} />
                                </div>
                                <span className={styles.checklistLabel}>{done}/{total}</span>
                            </div>
                            <div className={styles.checklistItems}>
                                {preview.map((item, i) => (
                                    <div key={i} className={`${styles.checklistItem} ${item.done ? styles.checklistItemDone : ''}`}>
                                        {item.done
                                            ? <MdCheckBox size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                                            : <MdCheckBoxOutlineBlank size={13} style={{ color: '#9ca3af', flexShrink: 0 }} />
                                        }
                                        <span>{item.text}</span>
                                    </div>
                                ))}
                                {total > 4 && (
                                    <span className={styles.checklistMore}>+{total - 4} more</span>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Comments count indicator */}
                {task.comments?.length > 0 && (
                    <div className={styles.commentCount}>
                        <MdChatBubble size={12} /> {task.comments.length}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
