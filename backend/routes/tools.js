import { Router } from 'express';
import { getTools, getToolById, createTool, updateTool, deleteTool } from '../controllers/toolsController.js';

const router = Router();

router.get('/', getTools);
router.get('/:id', getToolById);
router.post('/', createTool);
router.put('/:id', updateTool);
router.delete('/:id', deleteTool);

export default router;
