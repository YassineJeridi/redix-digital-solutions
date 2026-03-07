import { Router } from "express";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getSettings,
  updateSettings,
  getClientBudgets,
  upsertClientBudget,
  resetClientBudget,
  deleteClientBudget,
} from "../controllers/adsController.js";

const router = Router();

router.get("/summary", getSummary);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.get("/client-budgets", getClientBudgets);
router.put("/client-budgets/:clientName", upsertClientBudget);
router.post("/client-budgets/:clientName/reset", resetClientBudget);
router.delete("/client-budgets/:clientName", deleteClientBudget);
router.get("/", getTransactions);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
