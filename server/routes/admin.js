const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const auth = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// All admin routes require authentication AND admin role
router.use(auth, adminMiddleware);

// ─────────────────────────────────────────────
// GET /admin/bookings
// Returns all bookings in the system (read-only)
// ─────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('userId', 'name email batch')
            .populate('seatId', 'seatNumber type')
            .sort({ date: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// DELETE /admin/bookings/:id
// Force-release any booking (bypasses ownership check only)
// ─────────────────────────────────────────────
router.delete('/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        await booking.deleteOne();
        res.json({ message: 'Booking force-released by admin.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// PATCH /admin/seats/:id/disable
// Mark seat as inactive (maintenance mode)
// ─────────────────────────────────────────────
router.patch('/seats/:id/disable', async (req, res) => {
    try {
        const seat = await Seat.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!seat) return res.status(404).json({ message: 'Seat not found.' });
        res.json({ message: `Seat #${seat.seatNumber} disabled.`, seat });
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// PATCH /admin/seats/:id/enable
// Mark seat as active again
// ─────────────────────────────────────────────
router.patch('/seats/:id/enable', async (req, res) => {
    try {
        const seat = await Seat.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        );
        if (!seat) return res.status(404).json({ message: 'Seat not found.' });
        res.json({ message: `Seat #${seat.seatNumber} enabled.`, seat });
    } catch (err) {
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

module.exports = router;
