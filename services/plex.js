const { PlexOauth } = require('plex-oauth');
const { v4: uuidv4 } = require('uuid');

const clientId = process.env.PLEX_CLIENT_ID || uuidv4();

const plex = new PlexOauth({
    clientIdentifier: clientId,
    product: 'Server Portal',
    version: '1.0.0',
    device: 'Web',
    forwardUrl: process.env.PLEX_REDIRECT_URL || 'http://portal.eakin.cloud/auth/plex/callback',
    platform: 'Web'
});

function getLoginUrl() {
    return plex.requestHostedLoginURL();
}

async function getUserInfo(pinId) {
    try {
        console.log('Checking auth token for pinId:', pinId);
        const authToken = await plex.checkForAuthToken(pinId);
        console.log('Auth token:', authToken ? 'found' : 'not found');
        
        if (authToken) {
            const userInfo = await plex.getUserInfo(authToken);
            console.log('User info:', userInfo);
            return {
                authToken: authToken,
                userId: userInfo?.id,
                username: userInfo?.username,
                fullTitle: userInfo?.title || `${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`.trim(),
                email: userInfo?.email,
                thumb: userInfo?.thumb
            };
        }
        return null;
    } catch (error) {
        console.error('Plex OAuth error:', error);
        return null;
    }
}

const PLEX_SERVER_URL = process.env.PLEX_SERVER_URL || 'http://localhost:32400';

function buildPlexWebUrl(authToken) {
    return `${PLEX_SERVER_URL}/web/index.html?authToken=${authToken}`;
}

function buildOverseerrUrl() {
    return process.env.OVERSEERR_URL || 'http://localhost:5055';
}

function buildNextcloudUrl() {
    return process.env.NEXTCLOUD_URL || 'http://localhost:8080';
}

module.exports = {
    getLoginUrl,
    getUserInfo,
    buildPlexWebUrl,
    buildOverseerrUrl,
    buildNextcloudUrl,
    clientId
};