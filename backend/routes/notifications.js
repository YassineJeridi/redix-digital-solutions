import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
    getNotifications,
    markRead,
    markAllRead,
    deleteNotification,
} from '../controllers/notificationController.js';

const router = Router();

// Every notification route requires a valid JWT
router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);       // must be before /:id routes
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;
