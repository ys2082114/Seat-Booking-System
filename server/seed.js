require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Seat = require('./models/Seat');
const Holiday = require('./models/Holiday');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Seat.deleteMany({});
    await User.deleteMany({});
    await Holiday.deleteMany({});
    console.log('🗑️  Cleared existing seats, users, and holidays');

    // Create 50 seats: 1–40 designated, 41–50 floater
    const seats = [];
    for (let i = 1; i <= 50; i++) {
        seats.push({ seatNumber: i, type: i <= 40 ? 'designated' : 'floater' });
    }
    await Seat.insertMany(seats);
    console.log('💺 Created 50 seats (40 designated + 10 floater)');

    // Create sample users
    const users = [
        { name: 'Admin User', email: 'admin@example.com', password: 'admin123', batch: 'A', role: 'ADMIN' },
        { name: 'Alice (Batch A)', email: 'alice@example.com', password: 'password123', batch: 'A' },
        { name: 'Bob (Batch B)', email: 'bob@example.com', password: 'password123', batch: 'B' },
        { name: 'Carol (Batch A)', email: 'carol@example.com', password: 'password123', batch: 'A' },
    ];
    for (const u of users) {
        const user = new User(u);
        await user.save(); // triggers bcrypt pre-save hook
    }
    console.log('👤 Created 4 sample users (admin, alice, bob, carol)');

    // Sample holidays  
    const holidays = [
        { date: '2026-03-25', reason: 'Holi' },
        { date: '2026-04-14', reason: 'Dr. Ambedkar Jayanti' },
        { date: '2026-08-15', reason: 'Independence Day' },
        { date: '2026-10-02', reason: 'Gandhi Jayanti' },
        { date: '2026-12-25', reason: 'Christmas' },
    ];
    await Holiday.insertMany(holidays);
    console.log('🎉 Created sample holidays');

    console.log('\n✅ Seed complete! Sample credentials:');
    console.log('   admin@example.com / admin123    (ADMIN, Batch A)');
    console.log('   alice@example.com / password123 (USER,  Batch A)');
    console.log('   bob@example.com   / password123 (USER,  Batch B)');
    console.log('   carol@example.com / password123 (USER,  Batch A)');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
});
