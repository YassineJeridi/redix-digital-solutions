import Task from '../models/Task.js';
import BoardList from '../models/BoardList.js';
import { logAudit } from '../utils/auditLogger.js';
import { createNotification } from '../utils/notificationService.js';

// ── Board Lists ────────────────────────────────────

// @desc    Get all board lists (columns)
// @route   GET /api/tasks/lists
export const getBoardLists = async (req, res) => {
    try {
        let lists = await BoardList.find().sort({ order: 1 });

        // Seed defaults if none exist
        if (lists.length === 0) {
            const defaults = [
                { name: 'Todo', order: 0, color: '#6b7280', emoji: '📋' },
                { name: 'Doing', order: 1, color: '#f59e0b', emoji: '🔧' },
                { name: 'Done', order: 2, color: '#10b981', emoji: '✅' }
            ];
            lists = await BoardList.insertMany(defaults);
        }

        res.json(lists);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching board lists', error: error.message });
    }
};

// @desc    Create a new board list
// @route   POST /api/tasks/lists
export const createBoardList = async (req, res) => {
    try {
        const { name, color, emoji } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'List name is required' });
        }

        const existing = await BoardList.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ message: 'A list with this name already exists' });
        }

        const count = await BoardList.countDocuments();
        const list = new BoardList({
            name: name.trim(),
            order: count,
            color: color || '#6b7280',
            emoji: emoji || '📋'
        });
        await list.save();

        await logAudit({
            action: 'create',
            entityType: 'Task',
            entityId: list._id,
            details: { listName: list.name, type: 'board_list' }
        }, req);

        res.status(201).json(list);
    } catch (error) {
        res.status(400).json({ message: 'Error creating list', error: error.message });
    }
};

// @desc    Update a board list
// @route   PUT /api/tasks/lists/:id
export const updateBoardList = async (req, res) => {
    try {
        const list = await BoardList.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!list) return res.status(404).json({ message: 'List not found' });
        res.json(list);
    } catch (error) {
        res.status(400).json({ message: 'Error updating list', error: error.message });
    }
};

// @desc    Delete a board list (moves tasks to first remaining list)
// @route   DELETE /api/tasks/lists/:id
export const deleteBoardList = async (req, res) => {
    try {
        const list = await BoardList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });

        const remainingLists = await BoardList.find({ _id: { $ne: list._id } }).sort({ order: 1 });
        if (remainingLists.length === 0) {
            return res.status(400).json({ message: 'Cannot delete the last list' });
        }

        // Move tasks from deleted list to the first remaining list
        const fallback = remainingLists[0].name;
        await Task.updateMany({ status: list.name }, { $set: { status: fallback } });

        await BoardList.findByIdAndDelete(req.params.id);

        await logAudit({
            action: 'delete',
            entityType: 'Task',
            entityId: list._id,
            details: { listName: list.name, tasksMoved: fallback, type: 'board_list' }
        }, req);

        res.json({ message: 'List deleted', movedTo: fallback });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting list', error: error.message });
    }
};

// @desc    Reorder board lists
// @route   PATCH /api/tasks/lists/reorder
export const reorderBoardLists = async (req, res) => {
    try {
        const { lists } = req.body; // [{ id, order }]
        const ops = lists.map(l => ({
            updateOne: {
                filter: { _id: l.id },
                update: { $set: { order: l.order } }
            }
        }));
        await BoardList.bulkWrite(ops);
        res.json({ message: 'Lists reordered' });
    } catch (error) {
        res.status(400).json({ message: 'Error reordering lists', error: error.message });
    }
};

// @desc    Get all tasks (populated)
// @route   GET /api/tasks
export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('client', 'businessName ownerName')
            .populate('assignedTo', 'name email role profileImage')
            .sort({ status: 1, order: 1, createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
export const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('client', 'businessName ownerName')
            .populate('assignedTo', 'name email role profileImage');
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching task', error: error.message });
    }
};

// @desc    Create task
// @route   POST /api/tasks
export const createTask = async (req, res) => {
    try {
        // Assign order: place at end of its column
        const count = await Task.countDocuments({ status: req.body.status || 'Todo' });
        const task = new Task({ ...req.body, order: count });
        await task.save();

        const populated = await Task.findById(task._id)
            .populate('client', 'businessName ownerName')
            .populate('assignedTo', 'name email role profileImage');

        await logAudit({
            action: 'create',
            entityType: 'Task',
            entityId: task._id,
            details: { title: task.title, status: task.status }
        }, req);

        // Send notification to assigned team members
        if (task.assignedTo && task.assignedTo.length > 0) {
            for (const memberId of task.assignedTo) {
                await createNotification(
                    memberId,
                    `You have been assigned to task "${task.title}"`,
                    'info',
                    task._id
                );
            }

            await logAudit({
                action: 'team_assignment',
                entityType: 'Task',
                entityId: task._id,
                details: { title: task.title, assignedTo: task.assignedTo }
            }, req);
        }

        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: 'Error creating task', error: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
export const updateTask = async (req, res) => {
    try {
        // Get old task to compare assignees
        const oldTask = await Task.findById(req.params.id);
        if (!oldTask) return res.status(404).json({ message: 'Task not found' });

        const oldAssignees = (oldTask.assignedTo || []).map(id => id.toString());

        const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
            .populate('client', 'businessName ownerName')
            .populate('assignedTo', 'name email role profileImage');

        await logAudit({
            action: 'update',
            entityType: 'Task',
            entityId: task._id,
            details: { title: task.title, status: task.status }
        }, req);

        // Notify newly assigned members
        if (req.body.assignedTo) {
            const newAssignees = req.body.assignedTo.filter(id => !oldAssignees.includes(id.toString()));
            for (const memberId of newAssignees) {
                await createNotification(
                    memberId,
                    `You have been assigned to task "${task.title}"`,
                    'info',
                    task._id
                );
            }

            if (newAssignees.length > 0) {
                await logAudit({
                    action: 'team_assignment',
                    entityType: 'Task',
                    entityId: task._id,
                    details: { title: task.title, newAssignees }
                }, req);
            }
        }

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: 'Error updating task', error: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        await logAudit({
            action: 'delete',
            entityType: 'Task',
            entityId: task._id,
            details: { title: task.title }
        }, req);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
};

// @desc    Update task status (drag-and-drop)
// @route   PATCH /api/tasks/:id/status
export const updateTaskStatus = async (req, res) => {
    try {
        const { status, order } = req.body;
        const oldTask = await Task.findById(req.params.id);
        if (!oldTask) return res.status(404).json({ message: 'Task not found' });

        const oldStatus = oldTask.status;
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { status, order },
            { new: true, runValidators: true }
        )
            .populate('client', 'businessName ownerName')
            .populate('assignedTo', 'name email role profileImage');

        // Notify assigned members of status change
        if (oldStatus !== status && task.assignedTo && task.assignedTo.length > 0) {
            for (const member of task.assignedTo) {
                const memberId = member._id || member;
                await createNotification(
                    memberId,
                    `Task "${task.title}" moved from ${oldStatus} to ${status}`,
                    status === 'Done' ? 'success' : 'info',
                    task._id
                );
            }
        }

        await logAudit({
            action: 'status_change',
            entityType: 'Task',
            entityId: task._id,
            details: { title: task.title, from: oldStatus, to: status }
        }, req);

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: 'Error updating task status', error: error.message });
    }
};

// @desc    Reorder tasks in bulk (after drag-and-drop)
// @route   PATCH /api/tasks/reorder
export const reorderTasks = async (req, res) => {
    try {
        const { tasks } = req.body; // [{ _id, status, order }]
        const ops = tasks.map(t => ({
            updateOne: {
                filter: { _id: t._id },
                update: { $set: { status: t.status, order: t.order } }
            }
        }));
        await Task.bulkWrite(ops);
        res.json({ message: 'Tasks reordered' });
    } catch (error) {
        res.status(400).json({ message: 'Error reordering tasks', error: error.message });
    }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
export const addComment = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.comments.push({
            text: req.body.text,
            author: req.body.author || req.user?.name || 'Unknown'
        });
        await task.save();

        const populated = await Task.findById(task._id)
            .populate('client', 'businessName ownerName')
            .populate('assignedTo', 'name email role profileImage');

        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: 'Error adding comment', error: error.message });
    }
};
