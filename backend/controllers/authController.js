import User from '../models/User.js';
import TeamMember from '../models/TeamMember.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'default-secret-key', {
        expiresIn: '30d',
    });
};

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login user or team member
// @route   POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Try User model first
        let user = await User.findOne({ email }).select('+password');
        if (user) {
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            user.lastLogin = new Date();
            await user.save();

            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                accountType: 'user',
                token: generateToken(user._id),
            });
        }

        // Fallback to TeamMember model
        const member = await TeamMember.findOne({ email }).select('+password');
        if (!member) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!member.password) {
            return res.status(401).json({ message: 'Account not set up. Please ask an admin to set your password.' });
        }

        if (member.status !== 'active') {
            return res.status(401).json({ message: 'Your account is currently inactive. Please contact an admin.' });
        }

        const isMatch = await member.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        return res.json({
            _id: member._id,
            name: member.name,
            email: member.email,
            role: member.role,
            accountType: 'member',
            token: generateToken(member._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
    try {
        // Try User model first
        let user = await User.findById(req.user.id);
        if (user) {
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                accountType: 'user',
            });
        }

        // Fallback to TeamMember
        const member = await TeamMember.findById(req.user.id);
        if (member) {
            return res.json({
                _id: member._id,
                name: member.name,
                email: member.email,
                role: member.role,
                accountType: 'member',
            });
        }

        return res.status(404).json({ message: 'User not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Try User model first
        let user = await User.findById(req.user.id).select('+password');
        if (user) {
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            user.password = newPassword;
            await user.save();
            return res.json({ message: 'Password updated successfully' });
        }

        // Fallback to TeamMember
        const member = await TeamMember.findById(req.user.id).select('+password');
        if (member) {
            if (!member.password) {
                return res.status(400).json({ message: 'No password set. Please ask an admin to set your password first.' });
            }

            const isMatch = await member.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            member.password = newPassword;
            await member.save();
            return res.json({ message: 'Password updated successfully' });
        }

        return res.status(404).json({ message: 'User not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
