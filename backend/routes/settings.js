import { Router } from 'express';
import {
    getTeamMembers,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    addPayment,
    addAdvance,
    addWithdrawal,
    verifyPasskey,
    updatePasskey
} from '../controllers/settingsController.js';
import protect from '../middleware/auth.js';

const router = Router();

// Passkey routes
router.post('/verify-passkey', verifyPasskey);          // public
router.put('/passkey', protect, updatePasskey);          // auth required

// Team member routes
router.get('/', getTeamMembers);
router.post('/', createTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);
router.post('/:id/payment', addPayment);
router.post('/:id/advance', addAdvance);
router.post('/:id/withdrawal', addWithdrawal);

export default router;
