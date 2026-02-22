import { Router } from 'express';
import {
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    getInvoiceStats,
    exportInvoiceXml,
    exportInvoicePdf,
    sendInvoiceTelegram,
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// Stats must be before /:id to avoid route conflict
router.get('/stats',              getInvoiceStats);
router.get('/',                   getInvoices);
router.get('/:id',                getInvoice);
router.post('/',                  createInvoice);
router.put('/:id',                updateInvoice);
router.patch('/:id/status',       updateInvoiceStatus);
router.delete('/:id',             deleteInvoice);
// Export
router.get('/:id/export/xml',     exportInvoiceXml);
router.get('/:id/export/pdf',     exportInvoicePdf);
router.post('/:id/send-telegram', sendInvoiceTelegram);

export default router;
