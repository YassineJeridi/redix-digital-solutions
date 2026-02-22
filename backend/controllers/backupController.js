import mongoose from 'mongoose';
import archiver from 'archiver';
import axios from 'axios';
import FormData from 'form-data';
import { PassThrough } from 'stream';
import { logAudit } from '../utils/auditLogger.js';


/* ─── In-memory last-backup status (resets on server restart) ─── */
let lastBackup = null;

/**
 * Core backup logic — can be called from a cron job OR from the manual trigger.
 *
 * 1. Reads every MongoDB collection.
 * 2. Packs them as individual JSON files inside a ZIP (in memory).
 * 3. Sends the ZIP to the Telegram chat via Bot API (sendDocument).
 *
 * @param {String} triggeredBy - label: user name or "Scheduled (Daily)"
 * @returns {Object} result summary
 */
export const performBackup = async (triggeredBy = 'system') => {
    const start = Date.now();
    const TELEGRAM_BOT_TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID     = process.env.TELEGRAM_CHAT_ID;
    const TELEGRAM_THREAD_BACKUP = process.env.TELEGRAM_THREAD_BACKUP;

    try {
        console.log('🔄 Starting database backup...');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        let totalDocuments = 0;
        const collectionData = {};

        for (const col of collections) {
            const docs = await db.collection(col.name).find({}).toArray();
            collectionData[col.name] = docs;
            totalDocuments += docs.length;
            console.log(`  📦 ${col.name}: ${docs.length} docs`);
        }

        /* ── Build ZIP in memory ── */
        const zipBuffer = await new Promise((resolve, reject) => {
            const archive = archiver('zip', { zlib: { level: 9 } });
            const chunks = [];
            const stream = new PassThrough();

            stream.on('data', (c) => chunks.push(c));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
            archive.pipe(stream);

            for (const [name, docs] of Object.entries(collectionData)) {
                archive.append(JSON.stringify(docs, null, 2), {
                    name: `${name}.json`,
                });
            }
            archive.finalize();
        });

        /* ── Send to Telegram ── */
        const now = new Date();
        const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `backup-${ts}.zip`;

        const form = new FormData();
        form.append('chat_id', TELEGRAM_CHAT_ID);
        if (TELEGRAM_THREAD_BACKUP) form.append('message_thread_id', TELEGRAM_THREAD_BACKUP);
        form.append('document', zipBuffer, {
            filename: fileName,
            contentType: 'application/zip',
        });
        form.append(
            'caption',
            `🗄️ Redix Agency Backup\n` +
                `📅 ${now.toLocaleString()}\n` +
                `📊 ${collections.length} collections · ${totalDocuments} docs\n` +
                `📦 ${(zipBuffer.length / 1024).toFixed(1)} KB\n` +
                `👤 ${triggeredBy} · ⏱️ ${Date.now() - start}ms`
        );

        let tgJson;
        try {
            const tgRes = await axios.post(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
                form,
                { headers: form.getHeaders(), maxBodyLength: Infinity, maxContentLength: Infinity }
            );
            tgJson = tgRes.data;
        } catch (axErr) {
            const errData = axErr.response?.data;
            console.log('🔍 Telegram error detail:', JSON.stringify(errData));
            const desc = errData?.description || axErr.message;
            throw new Error(`Telegram API: ${desc}`);
        }

        if (!tgJson.ok) {
            throw new Error(`Telegram API: ${tgJson.description}`);
        }

        lastBackup = {
            time: now.toISOString(),
            status: 'success',
            collectionsCount: collections.length,
            totalDocuments,
            fileSize: `${(zipBuffer.length / 1024).toFixed(1)} KB`,
            duration: `${Date.now() - start}ms`,
            error: null,
        };

        console.log(`✅ Backup sent to Telegram (${lastBackup.fileSize})`);
        return lastBackup;
    } catch (error) {
        console.error('❌ Backup failed:', error.message);

        lastBackup = {
            time: new Date().toISOString(),
            status: 'failed',
            collectionsCount: 0,
            totalDocuments: 0,
            fileSize: null,
            duration: `${Date.now() - start}ms`,
            error: error.message,
        };
        throw error;
    }
};

/* ─── Route handlers ─── */

/**
 * POST /api/backup/trigger
 * Manually trigger a full backup (protected).
 */
export const triggerBackup = async (req, res) => {
    try {
        const who = req.user?.name || 'Unknown';
        const result = await performBackup(who);

        await logAudit(
            {
                action: 'backup_triggered',
                entityType: 'Backup',
                details: { triggeredBy: who, method: 'manual', ...result },
                performedBy: req.user?._id,
            },
            req
        );

        res.json({
            success: true,
            message: 'Backup completed and sent to Telegram',
            backup: result,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Backup failed',
            error: error.message,
        });
    }
};

/**
 * GET /api/backup/status
 * Return the last-known backup info + when the next daily run is scheduled.
 */
export const getBackupStatus = async (_req, res) => {
    try {
        const now = new Date();
        const next = new Date(now);
        next.setHours(24, 0, 0, 0); // next midnight

        res.json({
            success: true,
            lastBackup,
            nextScheduled: next.toISOString(),
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/backup/history
 * Pull the last 20 backup-related audit log entries.
 */
export const getBackupHistory = async (_req, res) => {
    try {
        const AuditLog = mongoose.model('AuditLog');
        const history = await AuditLog.find({ entityType: 'Backup' })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('performedBy', 'name')
            .lean();

        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
