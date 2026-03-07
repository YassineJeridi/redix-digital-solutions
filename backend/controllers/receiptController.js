import { PassThrough } from "stream";
import { buildReceiptPdf } from "../utils/receiptPdf.js";

/**
 * POST /api/receipts/generate
 * Body: { clientName, amountPaid, date, thankingOption }
 * Returns: PDF binary stream
 */
export const generateReceipt = async (req, res) => {
  try {
    const { clientName, amountPaid, date, thankingOption, paymentStatus } =
      req.body;

    if (!clientName || !clientName.trim()) {
      return res.status(400).json({ message: "Client name is required." });
    }
    if (
      amountPaid == null ||
      isNaN(Number(amountPaid)) ||
      Number(amountPaid) <= 0
    ) {
      return res
        .status(400)
        .json({ message: "A valid paid amount is required." });
    }
    if (!date) {
      return res.status(400).json({ message: "Payment date is required." });
    }

    const pass = new PassThrough();
    const filename = `receipt-${clientName.replace(/\s+/g, "-")}-${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    pass.pipe(res);

    await buildReceiptPdf(
      {
        clientName: clientName.trim(),
        amountPaid: Number(amountPaid),
        date,
        paymentStatus: paymentStatus || "paid",
        thankingOption: thankingOption || "continue",
      },
      pass,
    );
  } catch (error) {
    console.error("Error generating receipt:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};
