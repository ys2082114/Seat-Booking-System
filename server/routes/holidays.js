const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');
const auth = require('../middleware/authMiddleware');

// GET /holidays — list all holidays
router.get('/', auth, async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ date: 1 });
        res.json(holidays);
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// POST /holidays — add a holiday
router.post('/', auth, async (req, res) => {
    try {
        const { date, reason } = req.body;
        if (!date || !reason) {
            return res.status(400).json({ message: 'date and reason are required.' });
        }
        const existing = await Holiday.findOne({ date });
        if (existing) {
            return res.status(400).json({ message: 'A holiday already exists on that date.' });
        }
        const holiday = new Holiday({ date, reason });
        await holiday.save();
        res.status(201).json(holiday);
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// DELETE /holidays/:id — remove a holiday
router.delete('/:id', auth, async (req, res) => {
    try {
        const holiday = await Holiday.findByIdAndDelete(req.params.id);
        if (!holiday) {
            return res.status(404).json({ message: 'Holiday not found.' });
        }
        res.json({ message: 'Holiday removed.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

module.exports = router;
