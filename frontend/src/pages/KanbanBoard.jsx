import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    DndContext,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { MdAdd, MdAssignment, MdRefresh, MdClose, MdSearch } from 'react-icons/md';
import KanbanColumn from '../components/Tasks/KanbanColumn';
import TaskCard from '../components/Tasks/TaskCard';
import TaskModal from '../components/Tasks/TaskModal';
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    reorderTasks,
    addComment,
    getBoardLists,
    createBoardList,
    deleteBoardList
} from '../services/TasksServices';
import { getClients } from '../services/ClientsServices';
import { getTeamMembers } from '../services/SettingsServices';
import styles from './KanbanBoard.module.css';

const KanbanBoard = () => {
    const [tasks, setTasks] = useState([]);
    const [clients, setClients] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [boardLists, setBoardLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [defaultStatus, setDefaultStatus] = useState('Todo');

    // Drag state
    const [activeTask, setActiveTask] = useState(null);

    // Add List state
    const [showAddList, setShowAddList] = useState(false);
    const [newListName, setNewListName] = useState('');

    // Filter state — always visible, no toggle
    const [filterSearch, setFilterSearch] = useState('');
    const [filterAssignee, setFilterAssignee] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterDue, setFilterDue] = useState('');

    const hasActiveFilters = filterSearch || filterAssignee || filterPriority || filterDue;

    const clearFilters = () => {
        setFilterSearch('');
        setFilterAssignee('');
        setFilterPriority('');
        setFilterDue('');
    };

    // Derive ordered status names from boardLists
    const statuses = useMemo(() => boardLists.map(l => l.name), [boardLists]);

    // Build a config map from boardLists for KanbanColumn
    const listConfigMap = useMemo(() => {
        const map = {};
        boardLists.forEach(l => {
            map[l.name] = { label: l.name, color: l.color, emoji: l.emoji, name: l.name };
        });
        return map;
    }, [boardLists]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }
        })
    );

    // ── Data Fetching ──────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [tasksRes, clientsRes, membersRes, listsRes] = await Promise.all([
                getTasks(),
                getClients(),
                getTeamMembers(),
                getBoardLists()
            ]);
            setTasks(tasksRes.data || tasksRes || []);
            setClients(clientsRes.data || clientsRes || []);
            setTeamMembers(membersRes.data || membersRes || []);
            setBoardLists(listsRes.data || listsRes || []);
        } catch (err) {
            console.error('Failed to load kanban data:', err);
            setError('Failed to load tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Filtered Tasks ─────────────────────────────────
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            // Search filter
            if (filterSearch) {
                const q = filterSearch.toLowerCase();
                const titleMatch = (task.title || '').toLowerCase().includes(q);
                const descMatch = (task.description || '').toLowerCase().includes(q);
                if (!titleMatch && !descMatch) return false;
            }
            // Assignee filter
            if (filterAssignee) {
                const assignees = (task.assignedTo || []).map(m =>
                    typeof m === 'object' ? m._id : m
                );
                if (!assignees.includes(filterAssignee)) return false;
            }
            // Priority filter
            if (filterPriority) {
                if ((task.priority || 'Medium') !== filterPriority) return false;
            }
            // Due date filter
            if (filterDue) {
                if (!task.dueDate) return false;
                const due = new Date(task.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                if (filterDue === 'overdue' && due >= today) return false;
                if (filterDue === 'today' && (due < today || due >= tomorrow)) return false;
                if (filterDue === 'week') {
                    const weekEnd = new Date(today);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    if (due < today || due >= weekEnd) return false;
                }
            }
            return true;
        });
    }, [tasks, filterSearch, filterAssignee, filterPriority, filterDue]);

    const getTasksByStatus = (status) =>
        filteredTasks
            .filter(t => t.status === status)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // ── Find which column a task belongs to ────────────
    const findTaskColumn = (taskId) => {
        const task = tasks.find(t => t._id === taskId);
        return task ? task.status : null;
    };

    // ── Add List Handler ───────────────────────────────
    const handleAddList = async () => {
        const name = newListName.trim();
        if (!name) return;
        try {
            const created = await createBoardList({ name });
            const data = created.data || created;
            setBoardLists(prev => [...prev, data]);
            setNewListName('');
            setShowAddList(false);
        } catch (err) {
            console.error('Failed to create list:', err);
            alert(err.response?.data?.message || 'Failed to create list');
        }
    };

    const handleDeleteList = async (statusName) => {
        const list = boardLists.find(l => l.name === statusName);
        if (!list) return;
        if (boardLists.length <= 1) {
            alert('Cannot delete the last list');
            return;
        }
        if (!window.confirm(`Delete list "${statusName}"? Tasks will be moved to the first remaining list.`)) return;
        try {
            await deleteBoardList(list._id);
            fetchData(); // Refresh to get moved tasks
        } catch (err) {
            console.error('Failed to delete list:', err);
        }
    };

    // ── Drag Handlers ──────────────────────────────────
    const handleDragStart = (event) => {
        const task = tasks.find(t => t._id === event.active.id);
        setActiveTask(task || null);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeColumn = findTaskColumn(activeId);
        const overColumn = statuses.includes(overId)
            ? overId
            : findTaskColumn(overId);

        if (!activeColumn || !overColumn || activeColumn === overColumn) return;

        setTasks(prev =>
            prev.map(t =>
                t._id === activeId
                    ? { ...t, status: overColumn }
                    : t
            )
        );
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeColumn = findTaskColumn(activeId);
        const overColumn = statuses.includes(overId)
            ? overId
            : findTaskColumn(overId);

        if (!activeColumn || !overColumn) return;

        if (activeColumn === overColumn && !statuses.includes(overId)) {
            const columnTasks = getTasksByStatus(overColumn);
            const oldIndex = columnTasks.findIndex(t => t._id === activeId);
            const newIndex = columnTasks.findIndex(t => t._id === overId);

            if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(columnTasks, oldIndex, newIndex);
                const reorderPayload = reordered.map((t, i) => ({
                    id: t._id,
                    order: i,
                    status: overColumn
                }));

                setTasks(prev => {
                    const others = prev.filter(t => t.status !== overColumn);
                    return [...others, ...reordered.map((t, i) => ({ ...t, order: i }))];
                });

                try {
                    await reorderTasks(reorderPayload);
                } catch (err) {
                    console.error('Reorder failed:', err);
                    fetchData();
                }
                return;
            }
        }

        const targetTasks = getTasksByStatus(overColumn);
        const newOrder = targetTasks.length;

        setTasks(prev =>
            prev.map(t =>
                t._id === activeId
                    ? { ...t, status: overColumn, order: newOrder }
                    : t
            )
        );

        try {
            await updateTaskStatus(activeId, overColumn, newOrder);
        } catch (err) {
            console.error('Status update failed:', err);
            fetchData();
        }
    };

    // ── Modal Handlers ─────────────────────────────────
    const handleAddTask = (status = statuses[0] || 'Todo') => {
        setEditingTask(null);
        setDefaultStatus(status);
        setModalOpen(true);
    };

    const handleTaskClick = (task) => {
        setEditingTask(task);
        setDefaultStatus(task.status);
        setModalOpen(true);
    };

    const handleSave = async (formData) => {
        try {
            if (editingTask) {
                const updated = await updateTask(editingTask._id, formData);
                const data = updated.data || updated;
                setTasks(prev =>
                    prev.map(t => (t._id === data._id ? data : t))
                );
            } else {
                const created = await createTask(formData);
                const data = created.data || created;
                setTasks(prev => [...prev, data]);
            }
            setModalOpen(false);
            setEditingTask(null);
        } catch (err) {
            console.error('Save failed:', err);
            throw err;
        }
    };

    const handleDelete = async (taskId) => {
        try {
            await deleteTask(taskId);
            setTasks(prev => prev.filter(t => t._id !== taskId));
            setModalOpen(false);
            setEditingTask(null);
        } catch (err) {
            console.error('Delete failed:', err);
            throw err;
        }
    };

    const handleAddComment = async (taskId, text, author) => {
        try {
            const result = await addComment(taskId, text, author);
            const updated = result.data || result;
            setTasks(prev =>
                prev.map(t => (t._id === updated._id ? updated : t))
            );
            return updated;
        } catch (err) {
            console.error('Add comment failed:', err);
            throw err;
        }
    };

    // ── Render ─────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>
                            <MdAssignment size={28} /> Task Board
                        </h1>
                        <p className={styles.pageSubtitle}>Manage your team's workflow</p>
                    </div>
                </div>
                <div className={styles.board}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className={styles.skeletonColumn}>
                            <div className={styles.skeletonHeader} />
                            <div className={styles.skeletonBar} />
                            {[1, 2, 3].map(j => (
                                <div key={j} className={styles.skeletonCard} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>
                            <MdAssignment size={28} /> Task Board
                        </h1>
                    </div>
                </div>
                <div className={styles.errorState}>
                    <p>{error}</p>
                    <button className={styles.retryBtn} onClick={fetchData}>
                        <MdRefresh size={18} /> Retry
                    </button>
                </div>
            </div>
        );
    }

    const totalTasks = tasks.length;
    const filteredCount = filteredTasks.length;

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>
                        <MdAssignment size={28} /> Task Board
                    </h1>
                    <p className={styles.pageSubtitle}>
                        {hasActiveFilters
                            ? `${filteredCount} of ${totalTasks} task${totalTasks !== 1 ? 's' : ''} (filtered)`
                            : `${totalTasks} task${totalTasks !== 1 ? 's' : ''} across ${statuses.length} columns`
                        }
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.refreshBtn} onClick={fetchData} title="Refresh">
                        <MdRefresh size={20} />
                    </button>
                    <button className={styles.addTaskBtn} onClick={() => handleAddTask()}>
                        <MdAdd size={20} /> New Task
                    </button>
                </div>
            </div>

            {/* Filter Bar — Always Visible */}
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Search</label>
                    <div className={styles.searchInputWrap}>
                        <MdSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            value={filterSearch}
                            onChange={e => setFilterSearch(e.target.value)}
                            placeholder="Search tasks..."
                            className={styles.filterInput}
                        />
                    </div>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Assignee</label>
                    <select
                        value={filterAssignee}
                        onChange={e => setFilterAssignee(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">All Members</option>
                        {teamMembers.map(m => (
                            <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Priority</label>
                    <select
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">All Priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Due Date</label>
                    <select
                        value={filterDue}
                        onChange={e => setFilterDue(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">Any Date</option>
                        <option value="overdue">Overdue</option>
                        <option value="today">Due Today</option>
                        <option value="week">This Week</option>
                    </select>
                </div>

                {hasActiveFilters && (
                    <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                        <MdClose size={16} /> Clear
                    </button>
                )}
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className={styles.board}>
                    {statuses.map(status => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            tasks={getTasksByStatus(status)}
                            onTaskClick={handleTaskClick}
                            onAddTask={handleAddTask}
                            listConfig={listConfigMap[status]}
                            onDeleteList={boardLists.length > 1 ? handleDeleteList : undefined}
                        />
                    ))}

                    {/* Add List Button */}
                    <div className={styles.addListColumn}>
                        {showAddList ? (
                            <div className={styles.addListForm}>
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={e => setNewListName(e.target.value)}
                                    placeholder="List name..."
                                    className={styles.addListInput}
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleAddList();
                                        if (e.key === 'Escape') { setShowAddList(false); setNewListName(''); }
                                    }}
                                />
                                <div className={styles.addListActions}>
                                    <button className={styles.addListConfirm} onClick={handleAddList}>
                                        Add
                                    </button>
                                    <button className={styles.addListCancel} onClick={() => { setShowAddList(false); setNewListName(''); }}>
                                        <MdClose size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button className={styles.addListBtn} onClick={() => setShowAddList(true)}>
                                <MdAdd size={20} /> Add List
                            </button>
                        )}
                    </div>
                </div>
                <DragOverlay>
                    {activeTask ? (
                        <TaskCard task={activeTask} onClick={() => {}} />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Task Modal */}
            {modalOpen && (
                <TaskModal
                    isOpen={modalOpen}
                    task={editingTask}
                    clients={clients}
                    teamMembers={teamMembers}
                    statuses={statuses}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onAddComment={handleAddComment}
                    onClose={() => {
                        setModalOpen(false);
                        setEditingTask(null);
                    }}
                    defaultStatus={defaultStatus}
                />
            )}
        </div>
    );
};

export default KanbanBoard;
