import { Router } from 'express';
import {
    getFinancialMetrics,
    updateInvestmentReserve,
    updateRedixCaisse
} from '../controllers/financialController.js';

const router = Router();

router.get('/', getFinancialMetrics);
router.put('/investment', updateInvestmentReserve);
router.put('/caisse', updateRedixCaisse);

export default router;
