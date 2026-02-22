import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
    triggerBackup,
    getBackupStatus,
    getBackupHistory,
} from '../controllers/backupController.js';

const router = Router();

// All backup routes require authentication
router.use(protect);

router.get('/status', getBackupStatus);
router.get('/history', getBackupHistory);
router.post('/trigger', triggerBackup);

export default router;
