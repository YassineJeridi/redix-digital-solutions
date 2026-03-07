import { Router } from "express";
import { generateReceipt } from "../controllers/receiptController.js";

const router = Router();

router.post("/generate", generateReceipt);

export default router;
