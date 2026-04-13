const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const mailService = require('../services/mail');

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res) => {
    const users = await db.getAllUsers();
    const pending = users.filter(u => u.status === 'pending');
    const approved = users.filter(u => u.status === 'approved');
    const denied = users.filter(u => u.status === 'denied');
    
    res.render('admin', {
        user: req.session.user,
        users,
        pending,
        approved,
        denied,
        stats: { total: users.length, pending: pending.length, approved: approved.length, denied: denied.length }
    });
});

router.get('/users', requireAuth, requireAdmin, async (req, res) => {
    const users = await db.getAllUsers();
    res.json({ users });
});

router.post('/users', requireAuth, requireAdmin, async (req, res) => {
    const { email, username, password, first_name, last_name, role, send_email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    let tempPassword = password;
    if (!tempPassword) {
        tempPassword = uuidv4().replace(/-/g, '').substring(0, 12);
    }
    const password_hash = await bcrypt.hash(tempPassword, 10);
    
    try {
        const id = await db.createUser({
            email,
            username: username || email.split('@')[0],
            password_hash,
            first_name: first_name || '',
            last_name: last_name || '',
            role: role || 'user',
            status: 'approved'
        });
        
        if (send_email !== 'false') {
            try {
                await mailService.sendUserCreatedNotification(email, first_name, tempPassword);
            } catch (e) {
                console.error('Failed to send user notification email:', e.message);
            }
        }
        
        res.json({ success: true, id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

router.put('/users/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { email, username, password, first_name, last_name, role, status } = req.body;
    
    try {
        const updates = {};
        if (email) updates.email = email;
        if (username) updates.username = username;
        if (first_name !== undefined) updates.first_name = first_name;
        if (last_name !== undefined) updates.last_name = last_name;
        if (role) updates.role = role;
        if (status) updates.status = status;
        
        if (password) {
            updates.password_hash = await bcrypt.hash(password, 10);
        }
        
        await db.updateUser(id, updates);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    if (parseInt(id) === req.session.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    
    try {
        await db.deleteUser(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

router.post('/users/:id/approve', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.updateUser(id, { status: 'approved' });
        
        const services = ['plex', 'overseerr', 'nextcloud'];
        for (const service of services) {
            await db.setUserService(id, service, true);
        }
        
        try {
            const user = await db.getUserById(id);
            if (user) {
                await mailService.sendApprovalNotification(user.email, user.first_name);
            }
        } catch (e) {
            console.error('Failed to send approval notification:', e.message);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ error: 'Failed to approve user' });
    }
});

router.post('/users/:id/deny', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.updateUser(id, { status: 'denied' });
        res.json({ success: true });
    } catch (error) {
        console.error('Deny user error:', error);
        res.status(500).json({ error: 'Failed to deny user' });
    }
});

router.post('/users/:id/services', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { service, enabled } = req.body;
    
    if (!service) {
        return res.status(400).json({ error: 'Service is required' });
    }
    
    try {
        await db.setUserService(id, service, enabled);
        res.json({ success: true });
    } catch (error) {
        console.error('Set service error:', error);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

module.exports = router;