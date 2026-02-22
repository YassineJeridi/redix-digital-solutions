import { Router } from 'express';
import {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getFinancialSummary,
    addManualDeposit
} from '../controllers/expensesController.js';

const router = Router();

// Financial summary route (Redix Caisse - Expenses)
router.get('/summary', getFinancialSummary);

// Manual deposit route
router.post('/deposit', addManualDeposit);

// CRUD routes
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
