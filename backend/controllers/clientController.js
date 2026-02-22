import Client from '../models/Client.js';
import { logAudit } from '../utils/auditLogger.js';

export const getClients = async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        res.json(clients);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching clients',
            error: error.message
        });
    }
};

export const createClient = async (req, res) => {
    try {
        const client = new Client(req.body);
        await client.save();

        await logAudit({
            action: 'create',
            entityType: 'Client',
            entityId: client._id,
            details: { businessName: client.businessName, ownerName: client.ownerName }
        }, req);

        res.status(201).json(client);
    } catch (error) {
        res.status(400).json({
            message: 'Error creating client',
            error: error.message
        });
    }
};

export const updateClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        await logAudit({
            action: 'update',
            entityType: 'Client',
            entityId: client._id,
            details: { businessName: client.businessName }
        }, req);

        res.json(client);
    } catch (error) {
        res.status(400).json({
            message: 'Error updating client',
            error: error.message
        });
    }
};

export const deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        await logAudit({
            action: 'delete',
            entityType: 'Client',
            entityId: client._id,
            details: { businessName: client.businessName }
        }, req);

        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting client',
            error: error.message
        });
    }
};
