import { Router } from 'express';
import {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    reorderTasks,
    addComment,
    getBoardLists,
    createBoardList,
    updateBoardList,
    deleteBoardList,
    reorderBoardLists
} from '../controllers/taskController.js';

const router = Router();

// Board Lists routes (must be before /:id routes)
router.get('/lists', getBoardLists);
router.post('/lists', createBoardList);
router.patch('/lists/reorder', reorderBoardLists);
router.put('/lists/:id', updateBoardList);
router.delete('/lists/:id', deleteBoardList);

// Task routes
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/reorder', reorderTasks);
router.post('/:id/comments', addComment);

export default router;
