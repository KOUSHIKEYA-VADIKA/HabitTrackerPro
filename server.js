require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');

// --- SECURITY PACKAGES ---
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Connect Mongo Fix
const MongoStore = require('connect-mongo').default || require('connect-mongo');

const app = express();

// ==========================================
// 1. NETWORK SECURITY
// ==========================================

// Helmet: Secures HTTP Headers
app.use(helmet({
    contentSecurityPolicy: false,
}));

// Rate Limit: Stops Brute Force
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/auth', limiter);


// ==========================================
// 2. PARSERS (Must come before security checks)
// ==========================================

// Database
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Locally'))
    .catch(err => console.error(err));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));


// ==========================================
// 3. DATA SECURITY (Safe Sanitization)
// ==========================================

// MANUAL MONGO SANITIZE
// This safely removes '$' keys to prevent Injection without crashing the server
app.use((req, res, next) => {
    function clean(obj) {
        if (obj instanceof Object) {
            for (const key in obj) {
                if (/^\$/.test(key)) {
                    delete obj[key]; // Delete dangerous keys like $gt
                } else {
                    clean(obj[key]); // Check nested objects
                }
            }
        }
    }
    if (req.body) clean(req.body);
    if (req.query) clean(req.query);
    if (req.params) clean(req.params);
    next();
});

// HPP: Prevents Parameter Pollution
app.use(hpp());


// ==========================================
// 4. SESSIONS & ROUTES
// ==========================================

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 1 Day
    }
}));

app.set('view engine', 'ejs');

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));