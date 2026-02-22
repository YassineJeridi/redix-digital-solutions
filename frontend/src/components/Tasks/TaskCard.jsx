import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdAccessTime, MdFlag, MdPerson } from 'react-icons/md';
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
                                {member.name?.charAt(0)?.toUpperCase() || '?'}
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

                {/* Comments count indicator */}
                {task.comments?.length > 0 && (
                    <div className={styles.commentCount}>
                        💬 {task.comments.length}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
