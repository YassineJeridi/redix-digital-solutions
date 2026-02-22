import Invoice from '../models/Invoice.js';
import AppSettings from '../models/AppSettings.js';
import { logAudit } from '../utils/auditLogger.js';
import { buildInvoiceXml } from '../utils/invoiceXml.js';
import { buildInvoicePdf } from '../utils/invoicePdf.js';
import axios from 'axios';
import { PassThrough } from 'stream';

// ─── GET /api/invoices/stats ──────────────────────────────
export const getInvoiceStats = async (req, res) => {
    try {
        const categories = ['Marketing', 'Production', 'Development'];
        const statuses   = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];

        const [byCategoryStatus, totals] = await Promise.all([
            Invoice.aggregate([
                {
                    $group: {
                        _id: { category: '$category', status: '$status' },
                        count:  { $sum: 1 },
                        amount: { $sum: '$totalAmount' },
                    },
                },
            ]),
            Invoice.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count:  { $sum: 1 },
                        amount: { $sum: '$totalAmount' },
                    },
                },
            ]),
        ]);

        // Build totals map
        const totalsMap = {};
        totals.forEach(t => { totalsMap[t._id] = { count: t.count, amount: t.amount }; });

        // Build per-category map
        const categoryMap = {};
        categories.forEach(c => {
            categoryMap[c] = {};
            statuses.forEach(s => { categoryMap[c][s] = { count: 0, amount: 0 }; });
        });
        byCategoryStatus.forEach(({ _id, count, amount }) => {
            if (categoryMap[_id.category]) {
                categoryMap[_id.category][_id.status] = { count, amount };
            }
        });

        res.json({
            totals: {
                paid:      totalsMap['Paid']     || { count: 0, amount: 0 },
                pending:   totalsMap['Sent']     || { count: 0, amount: 0 },
                overdue:   totalsMap['Overdue']  || { count: 0, amount: 0 },
                draft:     totalsMap['Draft']    || { count: 0, amount: 0 },
                cancelled: totalsMap['Cancelled']|| { count: 0, amount: 0 },
            },
            byCategory: categoryMap,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoice stats', error: error.message });
    }
};

// ─── GET /api/invoices ────────────────────────────────────
export const getInvoices = async (req, res) => {
    try {
        const { status, category, client, search, from, to } = req.query;
        const filter = {};

        if (status   && status   !== 'All') filter.status   = status;
        if (category && category !== 'All') filter.category = category;
        if (client)  filter.client = client;

        if (from || to) {
            filter.issueDate = {};
            if (from) filter.issueDate.$gte = new Date(from);
            if (to)   filter.issueDate.$lte = new Date(to);
        }

        let invoices = await Invoice.find(filter)
            .populate('client', 'businessName ownerName')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        if (search) {
            const q = search.toLowerCase();
            invoices = invoices.filter(inv =>
                inv.invoiceNumber.toLowerCase().includes(q) ||
                inv.client?.businessName?.toLowerCase().includes(q) ||
                inv.client?.ownerName?.toLowerCase().includes(q)
            );
        }

        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
};

// ─── GET /api/invoices/:id ────────────────────────────────
export const getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('client')
            .populate('createdBy', 'name email');

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoice', error: error.message });
    }
};

// ─── POST /api/invoices ───────────────────────────────────
export const createInvoice = async (req, res) => {
    try {
        const invoice = new Invoice({
            ...req.body,
            createdBy: req.user.id,
        });
        await invoice.save();

        await logAudit({
            action: 'create',
            entityType: 'Invoice',
            entityId: invoice._id,
            details: {
                invoiceNumber: invoice.invoiceNumber,
                category: invoice.category,
                totalAmount: invoice.totalAmount,
            },
        }, req);

        const populated = await Invoice.findById(invoice._id).populate('client', 'businessName ownerName');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: 'Error creating invoice', error: error.message });
    }
};

// ─── PUT /api/invoices/:id ────────────────────────────────
export const updateInvoice = async (req, res) => {
    try {
        const existing = await Invoice.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Invoice not found' });

        // Merge line items and other fields, then trigger pre-save hooks via save()
        Object.assign(existing, req.body);
        await existing.save();

        await logAudit({
            action: 'update',
            entityType: 'Invoice',
            entityId: existing._id,
            details: { invoiceNumber: existing.invoiceNumber },
        }, req);

        const populated = await Invoice.findById(existing._id).populate('client', 'businessName ownerName');
        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: 'Error updating invoice', error: error.message });
    }
};

// ─── PATCH /api/invoices/:id/status ──────────────────────
export const updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        invoice.status = status;
        if (status === 'Paid' && !invoice.paidAt) invoice.paidAt = new Date();
        await invoice.save();

        await logAudit({
            action: 'update',
            entityType: 'Invoice',
            entityId: invoice._id,
            details: { invoiceNumber: invoice.invoiceNumber, newStatus: status },
        }, req);

        res.json(invoice);
    } catch (error) {
        res.status(400).json({ message: 'Error updating status', error: error.message });
    }
};

// ─── DELETE /api/invoices/:id ─────────────────────────────
export const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        await logAudit({
            action: 'delete',
            entityType: 'Invoice',
            entityId: invoice._id,
            details: { invoiceNumber: invoice.invoiceNumber },
        }, req);

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting invoice', error: error.message });
    }
};

// ─── GET /api/invoices/:id/export/xml ────────────────────
export const exportInvoiceXml = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('client').populate('createdBy', 'name');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const xml = buildInvoiceXml(invoice.toObject());
        res.setHeader('Content-Type',        'application/xml; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.xml"`);
        res.send(xml);
    } catch (error) {
        res.status(500).json({ message: 'Error generating XML', error: error.message });
    }
};

// ─── GET /api/invoices/:id/export/pdf ────────────────────
export const exportInvoicePdf = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('client').populate('createdBy', 'name');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        res.setHeader('Content-Type',        'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);

        await buildInvoicePdf(invoice.toObject(), res);
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating PDF', error: error.message });
        }
    }
};

// ─── POST /api/invoices/:id/send-telegram ─────────────────
export const sendInvoiceTelegram = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('client').populate('createdBy', 'name');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Use env vars (falls back to AppSettings for backwards compatibility)
        const settings  = await AppSettings.getInstance();
        const botToken  = process.env.TELEGRAM_BOT_TOKEN  || settings.telegramBotToken;
        const chatId    = process.env.TELEGRAM_CHAT_ID    || settings.telegramChatId;
        const threadId  = process.env.TELEGRAM_THREAD_INVOICE;

        if (!botToken || !chatId) {
            return res.status(400).json({ message: 'Telegram credentials are not configured.' });
        }

        // 1. Send a text summary
        const clientName = invoice.client?.businessName || invoice.client?.ownerName || '—';
        const caption =
            `📄 *Invoice ${invoice.invoiceNumber}*\n` +
            `👤 Client: ${clientName}\n` +
            `📂 Category: ${invoice.category}\n` +
            `💰 Total: ${Number(invoice.totalAmount).toFixed(3)} ${invoice.currency}\n` +
            `📅 Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-TN') : '—'}\n` +
            `✅ Status: ${invoice.status}`;

        // 2. Generate PDF in memory
        const passthrough = new PassThrough();
        const chunks = [];
        passthrough.on('data', (c) => chunks.push(c));

        await buildInvoicePdf(invoice.toObject(), passthrough);

        const pdfBuffer = Buffer.concat(chunks);

        // 3. Send PDF to Telegram using multipart/form-data
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        form.append('chat_id', chatId);
        if (threadId) form.append('message_thread_id', threadId);
        form.append('caption', caption);
        form.append('parse_mode', 'Markdown');
        form.append('document', pdfBuffer, {
            filename:    `${invoice.invoiceNumber}.pdf`,
            contentType: 'application/pdf',
        });

        await axios.post(`https://api.telegram.org/bot${botToken}/sendDocument`, form, {
            headers: form.getHeaders(),
        });

        await logAudit({
            action: 'update',
            entityType: 'Invoice',
            entityId: invoice._id,
            details: { invoiceNumber: invoice.invoiceNumber, action: 'Sent to Telegram' },
        }, req);

        res.json({ message: `Invoice ${invoice.invoiceNumber} sent to Telegram successfully.` });
    } catch (error) {
        const telegramMsg = error?.response?.data?.description;
        res.status(500).json({
            message: telegramMsg || 'Error sending to Telegram',
            error: error.message,
        });
    }
};
