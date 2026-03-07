import PDFDocument from "pdfkit";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGO_PATH = join(__dirname, "../../frontend/src/assets/redix_logo.png");

// ── Palette ───────────────────────────────────────────────────────────────────
const PURPLE = "#c12de0";
const DARK = "#111827";
const MID = "#6b7280";
const LIGHT = "#f3f4f6";
const BORDER = "#e5e7eb";
const GREEN = "#059669";
const GREEN_L = "#d1fae5";
const WHITE = "#ffffff";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtAmt = (n) =>
  Number(n ?? 0).toLocaleString("en", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

export function buildReceiptPdf(
  { clientName, amountPaid, date, paymentStatus, thankingOption },
  output,
) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margin: 0, bufferPages: true });
    doc.pipe(output);
    doc.on("error", reject);
    output.on("finish", resolve);

    const PW = doc.page.width; // 419.53 (A5)
    const PH = doc.page.height; // 595.28 (A5)
    const PAD = 36; // page padding
    const CW = PW - PAD * 2;

    // White background
    doc.rect(0, 0, PW, PH).fill(WHITE);

    // ── 1. TOP BAR ──────────────────────────────────────────────────────────
    // Thin purple line at very top
    doc.rect(0, 0, PW, 4).fill(PURPLE);

    let y = 22;

    // Logo (left) — scaled to 34px tall
    if (existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, PAD, y, { height: 34, fit: [110, 34] });
      } catch (_) {
        /* ignore */
      }
    }

    // "RECEIPT" label (right, large)
    doc
      .save()
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor(DARK)
      .text("RECEIPT", 0, y + 4, { width: PW - PAD, align: "right" })
      .restore();

    y += 46;

    // Horizontal rule
    doc.rect(PAD, y, CW, 1).fill(BORDER);
    y += 14;

    // ── 2. META ROW (date left · ref right) ─────────────────────────────────
    doc
      .save()
      .fontSize(8)
      .font("Helvetica")
      .fillColor(MID)
      .text(`Date: ${fmtDate(date)}`, PAD, y)
      .restore();

    y += 20;

    // ── 3. AMOUNT HERO ───────────────────────────────────────────────────────
    // Light pill background for amount
    const pillH = 72;
    doc.roundedRect(PAD, y, CW, pillH, 8).fill(LIGHT);

    // Payment confirmed label
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .fillColor(GREEN)
      .text("PAYMENT CONFIRMED", 0, y + 10, { width: PW, align: "center" })
      .restore();

    // Big amount
    doc
      .save()
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor(DARK)
      .text(`${fmtAmt(amountPaid)} TND`, 0, y + 24, {
        width: PW,
        align: "center",
      })
      .restore();

    // Status pill (small, bottom center)
    const isPaid = paymentStatus !== "half";
    const badgeLabel = isPaid ? "Paid" : "Half Paid";
    const badgeBg = isPaid ? GREEN_L : "#fef3c7";
    const badgeColor = isPaid ? GREEN : "#d97706";
    const badgeW = 64;
    const badgeX = (PW - badgeW) / 2;
    doc.roundedRect(badgeX, y + pillH - 20, badgeW, 14, 7).fill(badgeBg);
    doc
      .save()
      .fontSize(7)
      .font("Helvetica-Bold")
      .fillColor(badgeColor)
      .text(badgeLabel, badgeX, y + pillH - 17, {
        width: badgeW,
        align: "center",
      })
      .restore();

    y += pillH + 20;

    // ── 4. PARTIES (from / to) ───────────────────────────────────────────────
    const colW = (CW - 16) / 2;

    // FROM
    doc
      .save()
      .fontSize(6.5)
      .font("Helvetica-Bold")
      .fillColor(PURPLE)
      .text("FROM", PAD, y)
      .restore();
    doc
      .save()
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(DARK)
      .text(clientName || "—", PAD, y + 11, { width: colW })
      .restore();

    // TO
    const toX = PAD + colW + 16;
    doc
      .save()
      .fontSize(6.5)
      .font("Helvetica-Bold")
      .fillColor(PURPLE)
      .text("TO", toX, y)
      .restore();
    doc
      .save()
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(DARK)
      .text("Redix Digital Solutions", toX, y + 11, { width: colW })
      .restore();
    doc
      .save()
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(MID)
      .text("contact@redixdigitalsolutions.com", toX, y + 27, { width: colW })
      .text("(+216) 27 941 416", toX, y + 38, { width: colW })
      .restore();

    y += 56;

    // ── 5. DETAILS TABLE ─────────────────────────────────────────────────────
    doc.rect(PAD, y, CW, 1).fill(BORDER);
    y += 1;

    const rows = [
      ["Date", fmtDate(date)],
      ["Client", clientName || "—"],
      ["Amount Paid", `${fmtAmt(amountPaid)} TND`],
      ["Status", isPaid ? "Paid" : "Half Paid"],
    ];

    rows.forEach(([label, value], i) => {
      const rowY = y + i * 26;
      // subtle alternating bg
      if (i % 2 === 0) doc.rect(PAD, rowY, CW, 26).fill(LIGHT);

      doc
        .save()
        .fontSize(8)
        .font("Helvetica")
        .fillColor(MID)
        .text(label, PAD + 10, rowY + 8)
        .restore();

      const isAmt = i === 2;
      const isStat = i === 3;
      doc
        .save()
        .fontSize(isAmt ? 10 : 8.5)
        .font(isAmt || isStat ? "Helvetica-Bold" : "Helvetica")
        .fillColor(isStat ? (isPaid ? GREEN : "#d97706") : isAmt ? DARK : DARK)
        .text(value, PAD, rowY + 8, { width: CW - 10, align: "right" })
        .restore();
    });

    y += rows.length * 26;
    doc.rect(PAD, y, CW, 1).fill(BORDER);
    y += 20;

    // ── 6. THANK YOU LINE ────────────────────────────────────────────────────
    const thankMsg =
      thankingOption === "seeYouSoon"
        ? "We hope to see you again very soon. It has been a pleasure working with you."
        : "Thank you for your trust. We look forward to continuing our journey together.";

    doc
      .save()
      .fontSize(8.5)
      .font("Helvetica-Oblique")
      .fillColor(MID)
      .text(thankMsg, PAD, y, { width: CW, align: "center", lineGap: 2 })
      .restore();

    // ── 7. FOOTER ────────────────────────────────────────────────────────────
    // Push footer to bottom of page
    const footY = PH - 32;

    doc.rect(PAD, footY - 10, CW, 1).fill(BORDER);

    doc
      .save()
      .fontSize(7)
      .font("Helvetica")
      .fillColor(MID)
      .text(
        "Redix Digital Solutions  ·  contact@redixdigitalsolutions.com  ·  (+216) 27 941 416",
        PAD,
        footY,
        { width: CW, align: "center" },
      )
      .restore();

    doc.end();
  });
}
