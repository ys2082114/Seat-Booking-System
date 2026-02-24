require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const seatRoutes = require('./routes/seats');
const bookingRoutes = require('./routes/bookings');
const holidayRoutes = require('./routes/holidays');
const myBookingsRoutes = require('./routes/myBookings');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/seats', seatRoutes);
app.use('/bookings', bookingRoutes);
app.use('/holidays', holidayRoutes);
app.use('/my-bookings', myBookingsRoutes);
app.use('/admin', adminRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'Seat Booking API is running.' }));

// Connect to MongoDB then start server
const PORT = process.env.PORT || 5000;
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });
