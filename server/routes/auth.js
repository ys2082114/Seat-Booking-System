const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
    return jwt.sign(
        { id: user._id, name: user.name, email: user.email, batch: user.batch, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, batch } = req.body;
        if (!name || !email || !password || !batch) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (!['A', 'B'].includes(batch)) {
            return res.status(400).json({ message: 'Batch must be A or B.' });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered.' });
        }
        const user = new User({ name, email, password, batch });
        await user.save();
        const token = signToken(user);
        res.status(201).json({ token, user: { id: user._id, name, email, batch, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        const match = await user.comparePassword(password);
        if (!match) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        const token = signToken(user);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, batch: user.batch, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

module.exports = router;
