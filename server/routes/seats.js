const express = require('express');
const router = express.Router();
const Seat = require('../models/Seat');
const auth = require('../middleware/authMiddleware');

// GET /seats — return all 50 seats
router.get('/', auth, async (req, res) => {
    try {
        const seats = await Seat.find().sort({ seatNumber: 1 });
        res.json(seats);
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

module.exports = router;
