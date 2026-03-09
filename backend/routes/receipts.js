import { Router } from "express";
import { generateReceipt } from "../controllers/receiptController.js";

const router = Router();

router.post("/export-pdf", generateReceipt);

export default router;
