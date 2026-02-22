import PDFDocument from 'pdfkit';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const LOGO_PATH = join(__dirname, '../../frontend/src/assets/redix_logo.png');

// ── Palette ──────────────────────────────────────────────────────────────────
const PURPLE   = '#6d28d9';
const PURPLE_L = '#ede9fe';
const DARK     = '#1e1b4b';
const MID      = '#374151';
const GRAY     = '#9ca3af';
const LGRAY    = '#f9fafb';
const BORDER   = '#e5e7eb';
const GREEN    = '#059669';
const WHITE    = '#ffffff';

const curr = (inv) => inv.currency || 'TND';
const fmt  = (n)   => Number(n ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/**
 * Build a single-page PDF invoice and pipe it to the output stream.
 * @param {Object} invoice  - Populated Mongoose document
 * @param {Stream} output   - Writable stream (express res or PassThrough)
 */
export function buildInvoicePdf(invoice, output) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
        doc.pipe(output);
        doc.on('error', reject);
        output.on('finish', resolve);

        const PW   = doc.page.width;   // 595.28
        const PH   = doc.page.height;  // 841.89
        const ML   = 44;               // margin left
        const MR   = PW - 44;          // margin right
        const CW   = MR - ML;          // content width  507.28
        const client = invoice.client || {};
        const items  = invoice.lineItems || [];

        // ── helpers ──────────────────────────────────────────────────────────
        const line = (x1, y1, x2, y2, color = BORDER, w = 0.5) =>
            doc.save().strokeColor(color).lineWidth(w).moveTo(x1, y1).lineTo(x2, y2).stroke().restore();

        const pill = (text, x, y, bg, fg = WHITE) => {
            const tw = doc.widthOfString(text, { fontSize: 7.5 }) + 14;
            doc.save().roundedRect(x, y - 1, tw, 13, 6).fill(bg)
               .fontSize(7.5).font('Helvetica-Bold').fillColor(fg)
               .text(text, x + 7, y + 2, { width: tw - 14, align: 'center' }).restore();
            return tw;
        };

        const statusColor = {
            Paid: GREEN, Draft: GRAY, Sent: '#2563eb',
            Overdue: '#dc2626', Cancelled: '#6b7280',
        };

        // ════════════════════════════════════════════════════════════════════
        // 1 ── HEADER  (full-width purple band, 110px tall)
        // ════════════════════════════════════════════════════════════════════
        doc.rect(0, 0, PW, 110).fill(PURPLE);
        // subtle diagonal accent stripe
        doc.save().opacity(0.07)
           .moveTo(PW - 130, 0).lineTo(PW, 0).lineTo(PW, 110).lineTo(PW - 260, 110).closePath()
           .fill(WHITE).restore();

        // Logo (left side)
        const logoY = 22;
        let textStartX = ML;
        if (existsSync(LOGO_PATH)) {
            try {
                doc.image(LOGO_PATH, ML, logoY, { height: 66, fit: [160, 66] });
                textStartX = ML + 170;
            } catch (_) { /* logo load failed, proceed without */ }
        }
        if (!existsSync(LOGO_PATH)) {
            doc.save().fontSize(20).font('Helvetica-Bold').fillColor(WHITE)
               .text('Redix Digital', ML, 30)
               .fontSize(10).font('Helvetica').fillColor('rgba(255,255,255,0.7)')
               .text('Digital Solutions', ML, 56).restore();
        }

        // "FACTURE" label + number ( right side )
        doc.save()
           .fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.65)')
           .text('FACTURE', 0, 28, { width: MR - 6, align: 'right' })
           .fontSize(22).font('Helvetica-Bold').fillColor(WHITE)
           .text(invoice.invoiceNumber, 0, 44, { width: MR - 6, align: 'right' })
           .restore();

        // ════════════════════════════════════════════════════════════════════
        // 2 ── SUB-HEADER  thin accent bar with status pill
        // ════════════════════════════════════════════════════════════════════
        doc.rect(0, 110, PW, 30).fill(DARK);
        doc.save().fontSize(8).font('Helvetica').fillColor('rgba(255,255,255,0.5)')
           .text(`Émis le ${fmtDate(invoice.issueDate)}  ·  Échéance ${fmtDate(invoice.dueDate)}  ·  ${invoice.paymentMethod || '—'}  ·  ${invoice.category || '—'}`,
                 ML, 119, { width: CW - 80 })
           .restore();
        const sc = statusColor[invoice.status] || GRAY;
        pill(invoice.status?.toUpperCase() || 'DRAFT', MR - 72, 118, sc);

        // ════════════════════════════════════════════════════════════════════
        // 3 ── BILL-TO + COMPANY INFO  two columns
        // ════════════════════════════════════════════════════════════════════
        let y = 155;
        const colMid = ML + CW / 2 + 10;

        // left – bill to
        doc.save().fontSize(7).font('Helvetica-Bold').fillColor(PURPLE)
           .text('FACTURÉ À', ML, y).restore();
        y += 12;
        doc.save().fontSize(11).font('Helvetica-Bold').fillColor(DARK)
           .text(client.businessName || client.ownerName || '—', ML, y, { width: CW / 2 - 10 }).restore();
        y += 14;
        const clientLines = [
            client.businessName && client.ownerName ? client.ownerName : null,
            client.email, client.phone,
            client.matriculeFiscale ? `MF: ${client.matriculeFiscale}` : null,
            client.address,
        ].filter(Boolean);
        clientLines.forEach(l => {
            doc.save().fontSize(8.5).font('Helvetica').fillColor(MID)
               .text(l, ML, y, { width: CW / 2 - 10 }).restore();
            y += 12;
        });

        // right – our company info
        let ry = 155;
        doc.save().fontSize(7).font('Helvetica-Bold').fillColor(PURPLE)
           .text('DE', colMid, ry).restore();
        ry += 12;
        doc.save().fontSize(11).font('Helvetica-Bold').fillColor(DARK)
           .text('Redix Digital Solutions', colMid, ry).restore();
        ry += 14;
        [
            'contact@redixdigital.tn',
            '+216 XX XXX XXX',
            'Tunis, Tunisie',
        ].forEach(l => {
            doc.save().fontSize(8.5).font('Helvetica').fillColor(MID)
               .text(l, colMid, ry).restore();
            ry += 12;
        });

        y = Math.max(y, ry) + 14;
        line(ML, y, MR, y, BORDER, 0.5);
        y += 14;

        // ════════════════════════════════════════════════════════════════════
        // 4 ── LINE ITEMS TABLE
        // ════════════════════════════════════════════════════════════════════
        const COL = {
            desc:  ML,
            qty:   ML + 290,
            unit:  ML + 350,
            total: ML + 420,
        };
        const ROW_H = 20;

        // Table header
        doc.rect(ML, y, CW, 22).fill(DARK);
        doc.save().fontSize(7.5).font('Helvetica-Bold').fillColor('rgba(255,255,255,0.7)');
        doc.text('DESCRIPTION',    COL.desc + 6,  y + 7, { width: 280 });
        doc.text('QTÉ',            COL.qty,        y + 7, { width: 55,  align: 'right' });
        doc.text('PRIX UNIT.',     COL.unit,       y + 7, { width: 65,  align: 'right' });
        doc.text(`TOTAL (${curr(invoice)})`, COL.total, y + 7, { width: CW - (COL.total - ML), align: 'right' });
        doc.restore();
        y += 22;

        items.forEach((li, i) => {
            const bg = i % 2 === 0 ? WHITE : LGRAY;
            doc.rect(ML, y, CW, ROW_H).fill(bg);
            doc.save().fontSize(8.5).font('Helvetica').fillColor(MID);
            doc.text(li.description || '—',   COL.desc + 6, y + 5, { width: 278, ellipsis: true });
            doc.text(fmt(li.quantity),          COL.qty,      y + 5, { width: 55,  align: 'right' });
            doc.text(fmt(li.unitPrice),         COL.unit,     y + 5, { width: 65,  align: 'right' });
            doc.save().font('Helvetica-Bold').fillColor(DARK)
               .text(fmt(li.total),             COL.total,    y + 5, { width: CW - (COL.total - ML), align: 'right' }).restore();
            doc.restore();
            y += ROW_H;
        });

        // bottom border of table
        line(ML, y, MR, y, BORDER, 0.5);
        y += 16;

        // ════════════════════════════════════════════════════════════════════
        // 5 ── NOTES (left) + TOTALS (right)  side by side
        // ════════════════════════════════════════════════════════════════════
        const notesW  = CW * 0.48;
        const totalsX = ML + CW * 0.52;
        const totalsW = CW * 0.48;
        let ty = y;

        // notes block
        if (invoice.notes) {
            doc.save().fontSize(7).font('Helvetica-Bold').fillColor(PURPLE)
               .text('REMARQUES', ML, ty).restore();
            ty += 11;
            doc.save().fontSize(8.5).font('Helvetica').fillColor(MID)
               .text(invoice.notes, ML, ty, { width: notesW, lineGap: 2 }).restore();
        }

        // totals
        let toty = y;
        const totRow = (label, value, bold = false, color = MID) => {
            doc.save().fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
               .fillColor(GRAY).text(label, totalsX, toty, { width: totalsW / 2 })
               .fillColor(color).text(value, totalsX + totalsW / 2, toty, { width: totalsW / 2, align: 'right' })
               .restore();
            toty += 15;
        };

        totRow('Sous-total',           `${fmt(invoice.subTotal)} ${curr(invoice)}`);
        if ((invoice.discount ?? 0) > 0)
            totRow('Remise',           `− ${fmt(invoice.discount)} ${curr(invoice)}`, false, GREEN);
        totRow(`TVA (${invoice.taxRate ?? 0}%)`, `${fmt(invoice.taxAmount)} ${curr(invoice)}`);

        line(totalsX, toty + 2, totalsX + totalsW, toty + 2, BORDER, 0.5);
        toty += 10;

        // grand total box
        doc.rect(totalsX - 6, toty - 4, totalsW + 10, 32).fill(PURPLE);
        doc.save().fontSize(12).font('Helvetica-Bold').fillColor(WHITE)
           .text('TOTAL DÛ', totalsX, toty + 8, { width: totalsW / 2 })
           .text(`${fmt(invoice.totalAmount)} ${curr(invoice)}`, totalsX + totalsW / 2, toty + 8, { width: totalsW / 2, align: 'right' })
           .restore();

        y = Math.max(ty + (invoice.notes ? doc.heightOfString(invoice.notes, { width: notesW }) + 20 : 0),
                     toty + 44);

        // ════════════════════════════════════════════════════════════════════
        // 6 ── FOOTER BAR (pinned at page bottom)
        // ════════════════════════════════════════════════════════════════════
        const footH = 36;
        const footY = PH - footH;
        doc.rect(0, footY, PW, footH).fill(DARK);
        doc.save().fontSize(7.5).font('Helvetica').fillColor('rgba(255,255,255,0.45)')
           .text(
               `Redix Digital Solutions  ·  contact@redixdigital.tn  ·  Tunis, Tunisie  ·  ${invoice.invoiceNumber}`,
               ML, footY + 13, { width: CW, align: 'center' }
           ).restore();

        // thin purple line above footer
        doc.rect(0, footY - 3, PW, 3).fill(PURPLE);

        doc.end();
    });
}
