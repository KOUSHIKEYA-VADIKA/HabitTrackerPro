const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const User = require('../models/User');

// Middleware to check login
const protect = (req, res, next) => {
    if (!req.session.user) return res.redirect('/auth/login');
    next();
};

router.get('/', (req, res) => res.redirect('/dashboard'));

router.get('/dashboard', protect, async (req, res) => {
    const habits = await Habit.find({ user: req.session.user._id });
    // Refresh user data (for XP and Badges)
    const currentUser = await User.findById(req.session.user._id);
    res.render('dashboard', { habits, user: currentUser });
});

// Add Habit
router.post('/habits', protect, async (req, res) => {
    await Habit.create({
        user: req.session.user._id,
        title: req.body.title,
        category: req.body.category
    });
    res.redirect('/dashboard');
});

// --- SECURED ROUTE: Toggle Habit & Save Note ---
router.post('/habits/:id/toggle', protect, async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        const user = await User.findById(req.session.user._id);
        
        // Security: Get Note and Sanitize
        let { note } = req.body;

        if (note) {
            note = note.trim(); // Remove whitespace
            
            // 1. Force Length Limit (Backend Authority)
            if (note.length > 140) {
                note = note.substring(0, 140);
            }

            // 2. Escape HTML characters manually (Double protection alongside xss-clean)
            note = note.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        const today = new Date();
        const todayStr = today.setHours(0,0,0,0);
        
        // Check if already done today
        const exists = habit.logs.some(d => new Date(d).setHours(0,0,0,0) === todayStr);

        let newBadges = [];

        if (!exists) {
            // 1. Add Log
            habit.logs.push(new Date());
            habit.streak += 1;
            
            // 2. Add Journal Note (Only if valid)
            if (note && note.length > 0) {
                habit.journal.push({ date: new Date(), note: note });
            }

            // 3. Add XP
            user.xp += 10;
            if(user.xp >= 100 * user.level) {
                user.level += 1;
                user.xp = 0;
            }

            // --- 4. BADGE LOGIC ---
            const hour = new Date().getHours();
            const day = new Date().getDay(); // 0 = Sun, 6 = Sat

            const badgeList = [
                { id: 'first_step', name: 'First Step', icon: '🚀', condition: true }, // Always award on first ever
                { id: 'early_bird', name: 'Early Bird', icon: '🌅', condition: hour < 9 }, // Before 9 AM
                { id: 'night_owl', name: 'Night Owl', icon: '🦉', condition: hour >= 22 }, // After 10 PM
                { id: 'weekend_warrior', name: 'Weekend Warrior', icon: '⚔️', condition: (day === 0 || day === 6) },
                { id: 'streak_master', name: 'Streak Master', icon: '🔥', condition: habit.streak >= 7 }
            ];

            badgeList.forEach(b => {
                // Check if user already has this badge
                const hasBadge = user.badges.some(ub => ub.name === b.name);
                if (!hasBadge && b.condition) {
                    user.badges.push({ name: b.name, icon: b.icon, description: 'Earned for consistency' });
                    newBadges.push(b);
                }
            });
        }

        await habit.save();
        await user.save();
        
        res.json({ 
            success: true, 
            streak: habit.streak, 
            xp: user.xp, 
            level: user.level,
            newBadges: newBadges 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Delete Habit
router.delete('/habits/:id', protect, async (req, res) => {
    try {
        await Habit.findOneAndDelete({ _id: req.params.id, user: req.session.user._id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// API for Charts
router.get('/api/stats', protect, async (req, res) => {
    const habits = await Habit.find({ user: req.session.user._id });
    res.json(habits);
});

module.exports = router;