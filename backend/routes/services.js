import { Router } from 'express';
import {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    addNote,
    addAttachment,
    exportToCSV,
    exportToPDF,
    getServiceStats,
    updateServiceStatus,
    recordPartialPayment,
    updateInvoiceIssued
} from '../controllers/servicesController.js';
// import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Temporarily disable authentication until auth system is implemented
// router.use(protect);

// Get all services (with filters, search, sort, pagination)
router.get('/', getServices);

// Get service statistics
router.get('/stats', getServiceStats);

// Export routes
router.get('/export/csv', exportToCSV);
router.get('/export/pdf', exportToPDF);

// Get single service
router.get('/:id', getServiceById);

// Create service
router.post('/', createService);

// Update service
router.put('/:id', updateService);

// Inline status update
router.patch('/:id/status', updateServiceStatus);

// Toggle invoice issued status
router.patch('/:id/invoice-issued', updateInvoiceIssued);

// Record partial payment
router.post('/:id/partial-payment', recordPartialPayment);

// Delete service
router.delete('/:id', deleteService);

// Add note to service
router.post('/:id/notes', addNote);

// Add attachment to service
router.post('/:id/attachments', addAttachment);

export default router;
