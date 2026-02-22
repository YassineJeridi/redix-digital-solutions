import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TeamMember from '../models/TeamMember.js';

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
            
            // Try User model first, then fallback to TeamMember
            let user = await User.findById(decoded.id);
            if (!user) {
                user = await TeamMember.findById(decoded.id).select('-transactions');
            }
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }
            
            req.user = {
                id: user._id,
                role: user.role,
                email: user.email,
                name: user.name
            };
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to check if user has required role(s)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Normalize role comparison
        const userRole = req.user.role.toLowerCase();
        const allowedRoles = roles.map(role => role.toLowerCase());

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                message: `Role '${req.user.role}' is not authorized to access this resource. Required: ${roles.join(', ')}` 
            });
        }

        next();
    };
};

// Check if user can modify a service (either admin/manager, or team member assigned to service)
const canModifyService = async (req, res, next) => {
    try {
        const userRole = req.user.role.toLowerCase();
        
        // Admin and Manager can modify any service
        if (['admin', 'manager'].includes(userRole)) {
            return next();
        }

        // Team members can only view services they're assigned to
        const serviceId = req.params.id;
        const Service = (await import('../models/Service.js')).default;
        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Check if user is assigned to this service
        const isAssigned = service.teamMembers.some(
            member => member.toString() === req.user.id.toString()
        );

        if (!isAssigned) {
            return res.status(403).json({ 
                message: 'You are not authorized to access this service' 
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { protect, authorize, canModifyService };
export default protect;
