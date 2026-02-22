import { Router } from 'express';
import { getReports, exportReportCSV, exportReportPDF } from '../controllers/reportsController.js';

const router = Router();
router.get('/', getReports);
router.get('/export/csv', exportReportCSV);
router.get('/export/pdf', exportReportPDF);
export default router;
