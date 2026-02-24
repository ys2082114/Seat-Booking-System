const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const auth = require('../middleware/authMiddleware');

// GET /my-bookings — all bookings belonging to the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id })
            .populate('seatId', 'seatNumber type')
            .sort({ date: 1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

module.exports = router;
