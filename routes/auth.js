const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const mailService = require('../services/mail');

const router = express.Router();

router.get('/login', (req, res) => res.redirect('/'));

router.post('/login', async (req, res) => {
    const { email, password, remember_me } = req.body;
    
    console.log('Login attempt for:', email);
    
    if (!email || !password) {
        console.log('[AUTH] Missing credentials');
        return res.redirect('/?error=missing_credentials');
    }
    
    try {
        const user = await db.getUserByEmail(email);
        
        console.log('User found in DB:', !!user);
        
        if (!user) {
            console.log('[AUTH] User not found:', email);
            return res.redirect('/?error=invalid_credentials');
        }
        
        if (user.status === 'pending') {
            console.log('[AUTH] User pending approval:', email);
            return res.redirect('/?error=account_pending');
        }
        
        if (user.status === 'denied') {
            console.log('[AUTH] User denied:', email);
            return res.redirect('/?error=account_denied');
        }
        
        if (!user.password_hash) {
            console.log('[AUTH] No password hash for:', email);
            return res.redirect('/?error=invalid_credentials');
        }
        
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('[AUTH] Password mismatch for:', email);
            return res.redirect('/?error=invalid_credentials');
        }
        
        req.session.user = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            status: user.status
        };
        
        console.log('Session ID generated:', req.sessionID);
        
        if (remember_me === 'on') {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        }
        
        await db.updateUser(user.id, { last_login: true });
        
        console.log('[AUTH] Login successful:', email);
        const returnTo = req.body.return_to || '/dashboard';
        res.redirect(returnTo);
    } catch (error) {
        console.error('[AUTH] DB/Login error:', error.message);
        res.redirect('/?error=login_error');
    }
});

router.post('/register', async (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    
    if (!email || !password || !first_name) {
        return res.redirect('/?error=missing_fields');
    }
    
    try {
        const existing = await db.getUserByEmail(email);
        
        if (existing) {
            return res.redirect('/?error=email_exists');
        }
        
        const password_hash = await bcrypt.hash(password, 10);
        
        await db.createUser({
            email,
            username: email.split('@')[0],
            password_hash,
            first_name,
            last_name: last_name || '',
            role: 'user',
            status: 'pending'
        });
        
        try {
            await mailService.sendSignupNotification(email, first_name, last_name);
        } catch (e) {
            console.error('[REG] Email error:', e.message);
        }
        
        res.redirect('/?registered=true');
    } catch (error) {
        console.error('[REG] Registration error:', error);
        res.redirect('/?error=registration_failed');
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;