import express from 'express';
import { getAuditLogs, getAuditStats, clearOldLogs } from '../controllers/auditController.js';

const router = express.Router();

// GET /api/audit - Get all logs with filters
router.get('/', getAuditLogs);

// GET /api/audit/stats - Get audit statistics
router.get('/stats', getAuditStats);

// DELETE /api/audit/clear - Clear old logs
router.delete('/clear', clearOldLogs);

export default router;
