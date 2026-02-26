import { Router } from 'express';
import {
    getUpgradeItems,
    createUpgradeItem,
    updateUpgradeItem,
    deleteUpgradeItem,
    purchaseUpgradeItem,
    toggleFavorite,
    getUpgradeFund,
    addFundDeposit,
    subtractFund,
} from '../controllers/upgradeController.js';

const router = Router();

// Wishlist items
router.get('/items', getUpgradeItems);
router.post('/items', createUpgradeItem);
router.put('/items/:id', updateUpgradeItem);
router.delete('/items/:id', deleteUpgradeItem);
router.post('/items/:id/purchase', purchaseUpgradeItem);
router.patch('/items/:id/favorite', toggleFavorite);

// Investment fund
router.get('/fund', getUpgradeFund);
router.post('/fund/deposit', addFundDeposit);
router.post('/fund/subtract', subtractFund);

export default router;
