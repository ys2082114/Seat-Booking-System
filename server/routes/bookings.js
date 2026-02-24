const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const auth = require('../middleware/authMiddleware');
const { checkBookingPolicy } = require('../policyEngine');

// GET /bookings?week=YYYY-WW
// Returns all bookings for a given ISO week (format: "2026-09")
router.get('/', auth, async (req, res) => {
    try {
        const { week } = req.query; // e.g. "2026-09"
        if (!week) {
            return res.status(400).json({ message: 'week query param required (YYYY-WW).' });
        }
        // Parse year and week number
        const [yearStr, weekStr] = week.split('-');
        const year = parseInt(yearStr, 10);
        const weekNum = parseInt(weekStr, 10);

        // Compute all Mon–Fri dates for this ISO week
        // ISO week 1 = week containing first Thursday
        // Jan 4 is always in week 1 of its year
        const jan4 = new Date(Date.UTC(year, 0, 4));
        const jan4Day = jan4.getUTCDay() || 7; // Mon=1..Sun=7
        const weekMonday = new Date(jan4);
        weekMonday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (weekNum - 1) * 7);

        const dates = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(weekMonday);
            d.setUTCDate(weekMonday.getUTCDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }

        const bookings = await Booking.find({ date: { $in: dates } })
            .populate('seatId', 'seatNumber type')
            .populate('userId', 'name email batch');

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// POST /bookings
router.post('/', auth, async (req, res) => {
    try {
        const { seatId, date } = req.body;
        if (!seatId || !date) {
            return res.status(400).json({ message: 'seatId and date are required.' });
        }

        // Fetch seat
        const seat = await Seat.findById(seatId);
        if (!seat) {
            return res.status(404).json({ message: 'Seat not found.' });
        }

        // Run policy engine
        const { allowed, reason } = await checkBookingPolicy({
            batch: req.user.batch,
            seatType: seat.type,
            dateStr: date,
            now: new Date(),
        });

        if (!allowed) {
            return res.status(400).json({ message: reason });
        }

        // Save booking (unique index will catch duplicates)
        try {
            const booking = new Booking({ seatId, userId: req.user.id, date });
            await booking.save();
            const populated = await booking.populate([
                { path: 'seatId', select: 'seatNumber type' },
                { path: 'userId', select: 'name email batch' },
            ]);
            res.status(201).json(populated);
        } catch (dupErr) {
            if (dupErr.code === 11000) {
                return res.status(400).json({ message: 'This seat is already booked for that date.' });
            }
            throw dupErr;
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// DELETE /bookings/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        if (booking.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only cancel your own bookings.' });
        }
        await booking.deleteOne();
        res.json({ message: 'Booking cancelled successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

module.exports = router;
