import Tool from '../models/Tool.js';
import { logAudit } from '../utils/auditLogger.js';

export const getTools = async (req, res) => {
    try {
        const { search, category, status } = req.query;
        let query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (category) query.category = category;
        if (status) query.status = status;

        const tools = await Tool.find(query).sort({ createdAt: -1 });
        res.json(tools);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getToolById = async (req, res) => {
    try {
        const tool = await Tool.findById(req.params.id);
        if (!tool) return res.status(404).json({ message: 'Tool not found' });
        res.json(tool);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createTool = async (req, res) => {
    try {
        const tool = new Tool(req.body);
        await tool.save();

        await logAudit({
            action: 'create',
            entityType: 'Tool',
            entityId: tool._id,
            details: { name: tool.name, category: tool.category }
        }, req);

        res.status(201).json(tool);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateTool = async (req, res) => {
    try {
        const tool = await Tool.findById(req.params.id);
        if (!tool) return res.status(404).json({ message: 'Tool not found' });

        Object.assign(tool, req.body);
        await tool.save();

        await logAudit({
            action: 'update',
            entityType: 'Tool',
            entityId: tool._id,
            details: { name: tool.name }
        }, req);

        res.json(tool);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteTool = async (req, res) => {
    try {
        const tool = await Tool.findByIdAndDelete(req.params.id);
        if (!tool) return res.status(404).json({ message: 'Tool not found' });

        await logAudit({
            action: 'delete',
            entityType: 'Tool',
            entityId: tool._id,
            details: { name: tool.name }
        }, req);

        res.json({ message: 'Tool deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
