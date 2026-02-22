import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { MdAdd, MdDelete } from 'react-icons/md';
import TaskCard from './TaskCard';
import styles from './KanbanColumn.module.css';

const KanbanColumn = ({ status, tasks, onTaskClick, onAddTask, listConfig, onDeleteList }) => {
    const config = listConfig || { label: status, color: '#6b7280', emoji: '📋' };
    const taskIds = tasks.map(t => t._id);

    const { setNodeRef, isOver } = useDroppable({ id: status });

    return (
        <div className={`${styles.column} ${isOver ? styles.columnOver : ''}`}>
            {/* Column header */}
            <div className={styles.columnHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.emoji}>{config.emoji}</span>
                    <h3 className={styles.headerTitle}>{config.label || config.name || status}</h3>
                    <span
                        className={styles.count}
                        style={{ background: `${config.color}18`, color: config.color }}
                    >
                        {tasks.length}
                    </span>
                </div>
                <div className={styles.headerRight}>
                    <button
                        className={styles.addBtn}
                        onClick={() => onAddTask(status)}
                        title={`Add task to ${config.label || status}`}
                    >
                        <MdAdd size={18} />
                    </button>
                    {onDeleteList && (
                        <button
                            className={styles.deleteListBtn}
                            onClick={() => onDeleteList(status)}
                            title="Delete this list"
                        >
                            <MdDelete size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Column accent bar */}
            <div className={styles.accentBar} style={{ background: config.color }} />

            {/* Droppable area */}
            <div ref={setNodeRef} className={styles.taskList}>
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onClick={onTaskClick}
                        />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>No tasks here yet</p>
                        <button
                            className={styles.emptyAddBtn}
                            onClick={() => onAddTask(status)}
                        >
                            <MdAdd size={16} /> Add a task
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
