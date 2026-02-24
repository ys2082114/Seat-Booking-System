const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    seatNumber: { type: Number, required: true, unique: true },
    // 1–40 designated, 41–50 floater
    type: { type: String, enum: ['designated', 'floater'], required: true },
    // Admin can disable/enable seats (e.g. maintenance)
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Seat', seatSchema);
