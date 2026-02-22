import { Router } from 'express';
import {
    getCharges,
    createCharge,
    updateCharge,
    deleteCharge
} from '../controllers/chargesController.js';

const router = Router();

router.route('/')
    .get(getCharges)
    .post(createCharge);

router.route('/:id')
    .put(updateCharge)
    .delete(deleteCharge);

export default router;
