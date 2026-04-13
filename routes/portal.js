const express = require('express');
const db = require('../config/database');
const plexService = require('../services/plex');
const { requireAuth, requireApproved } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.redirect('/');
});

router.get('/dashboard', requireAuth, requireApproved, async (req, res) => {
    const user = req.session.user;
    let services = [];
    
    try {
        services = await db.getUserServices(user.id);
    } catch (e) {
        console.error('Error getting services:', e);
    }
    
    const serviceList = [
        { 
            id: 'plex', 
            name: 'Plex', 
            url: plexService.buildPlexWebUrl(user.plexToken || ''),
            description: 'Movies, TV & Music',
            icon: 'plex'
        },
        { 
            id: 'overseerr', 
            name: 'Overseerr', 
            url: plexService.buildOverseerrUrl(),
            description: 'Request Movies & TV',
            icon: 'overseerr'
        },
        { 
            id: 'nextcloud', 
            name: 'Nextcloud', 
            url: plexService.buildNextcloudUrl(),
            description: 'Files & Storage',
            icon: 'nextcloud'
        }
    ];
    
    res.render('dashboard', {
        user,
        services: serviceList,
        currentTheme: req.session.theme || 'system'
    });
});

router.get('/service/:id', requireAuth, requireApproved, async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;
    
    const serviceUrls = {
        plex: plexService.buildPlexWebUrl(user.plexToken || ''),
        overseerr: plexService.buildOverseerrUrl(),
        nextcloud: plexService.buildNextcloudUrl()
    };
    
    const url = serviceUrls[id];
    if (!url) {
        return res.status(404).send('Service not found');
    }
    
    res.redirect(url);
});

router.post('/theme', requireAuth, (req, res) => {
    const { theme } = req.body;
    req.session.theme = theme;
    res.json({ success: true, theme });
});

module.exports = router;