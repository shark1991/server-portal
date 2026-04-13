require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// CRITICAL: Trust proxy for Nginx
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session with fixed cookie settings for proxy
app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Crucial for Nginx setup
    cookie: { 
        secure: true, 
        httpOnly: true, 
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

app.use((req, res, next) => {
    res.locals.user = req.session?.user || null;
    res.locals.theme = req.session?.theme || null;
    next();
});

app.get('/', (req, res) => {
    if (req.session?.user) {
        return res.redirect('/dashboard');
    }
    const error = req.query.error || '';
    const registered = req.query.registered === 'true';
    const returnTo = req.query.return_to || '/dashboard';
    res.render('login', { error, registered, returnTo, user: null, theme: null });
});

app.get('/dashboard', (req, res) => {
    if (!req.session?.user) {
        return res.redirect('/?return_to=/dashboard');
    }
    if (req.session.user.status !== 'approved') {
        return res.status(403).send('Account pending approval');
    }
    const user = req.session.user;
    res.render('dashboard', { user, services: [], currentTheme: req.session.theme || 'system' });
});

app.get('/service/:id', (req, res) => {
    if (!req.session?.user) {
        return res.redirect('/?return_to=' + req.originalUrl);
    }
    const { id } = req.params;
    const serviceUrls = {
        plex: process.env.PLEX_SERVER_URL || 'http://localhost:32400',
        overseerr: process.env.OVERSEERR_URL || 'http://localhost:5055',
        nextcloud: process.env.NEXTCLOUD_URL || 'http://localhost:8080'
    };
    const url = serviceUrls[id];
    if (!url) return res.status(404).send('Service not found');
    res.redirect(url);
});

app.post('/theme', (req, res) => {
    if (req.session) {
        req.session.theme = req.body.theme;
    }
    res.json({ success: true });
});

app.use('/auth', require('./routes/auth'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});

module.exports = app;