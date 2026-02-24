const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
}, { timestamps: true });

// Prevent double-booking the same seat on the same date
bookingSchema.index({ seatId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
