const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    category: { type: String, default: 'General' },
    logs: [Date], // Keeps track of completion dates
    streak: { type: Number, default: 0 },
    // New Field: Journal Entries
    journal: [{
        date: { type: Date, default: Date.now },
        note: String
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Habit', HabitSchema);