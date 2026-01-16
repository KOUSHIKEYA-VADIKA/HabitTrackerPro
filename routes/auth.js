const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// --- 1. GET LOGIN PAGE (Show form) ---
router.get('/login', (req, res) => {
    // Pass 'error: null' so the EJS file doesn't crash on first load
    res.render('login', { error: null });
});

// --- 2. GET REGISTER PAGE ---
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// --- 3. POST REGISTER (Handle Sign up) ---
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('register', { error: 'Username already taken' });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await User.create({ username, password: hashedPassword });
        
        // Redirect to login with no error
        res.redirect('/auth/login');
    } catch (err) {
        res.render('register', { error: 'Something went wrong' });
    }
});

// --- 4. POST LOGIN (Handle Sign in) ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        
        // ERROR HANDLING 1: User not found
        if (!user) {
            return res.render('login', { error: 'Invalid Username or Password' });
        }

        // ERROR HANDLING 2: Password mismatch
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid Username or Password' });
        }

        // Success: Create Session
        req.session.user = user;
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Server Error' });
    }
});

// --- 5. LOGOUT ---
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
});

module.exports = router;