const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'server_portal',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
}

async function query(sql, params = []) {
    const pool = getPool();
    const [rows] = await pool.execute(sql, params);
    return rows;
}

async function getUserByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
}

async function getUserById(id) {
    const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
}

async function getUserByPlexUsername(plexUsername) {
    const rows = await query('SELECT * FROM users WHERE plex_username = ?', [plexUsername]);
    return rows[0] || null;
}

async function createUser(userData) {
    const { email, username, password_hash, plex_user_id, plex_username, first_name, last_name, role = 'user', status = 'pending' } = userData;
    const result = await query(
        'INSERT INTO users (email, username, password_hash, plex_user_id, plex_username, first_name, last_name, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [email, username, password_hash, plex_user_id, plex_username, first_name, last_name, role, status]
    );
    return result.insertId;
}

async function updateUser(id, userData) {
    const fields = [];
    const values = [];
    
    if (userData.username !== undefined) { fields.push('username = ?'); values.push(userData.username); }
    if (userData.password_hash !== undefined) { fields.push('password_hash = ?'); values.push(userData.password_hash); }
    if (userData.first_name !== undefined) { fields.push('first_name = ?'); values.push(userData.first_name); }
    if (userData.last_name !== undefined) { fields.push('last_name = ?'); values.push(userData.last_name); }
    if (userData.plex_username !== undefined) { fields.push('plex_username = ?'); values.push(userData.plex_username); }
    if (userData.plex_user_id !== undefined) { fields.push('plex_user_id = ?'); values.push(userData.plex_user_id); }
    if (userData.role !== undefined) { fields.push('role = ?'); values.push(userData.role); }
    if (userData.status !== undefined) { fields.push('status = ?'); values.push(userData.status); }
    if (userData.last_login !== undefined) { fields.push('last_login = NOW()'); }
    
    if (fields.length === 0) return;
    
    values.push(id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
}

async function deleteUser(id) {
    await query('DELETE FROM user_services WHERE user_id = ?', [id]);
    await query('DELETE FROM users WHERE id = ?', [id]);
}

async function getAllUsers() {
    return query('SELECT * FROM users ORDER BY created_at DESC');
}

async function getUsersByStatus(status) {
    return query('SELECT * FROM users WHERE status = ? ORDER BY created_at DESC', [status]);
}

async function getUserServices(userId) {
    return query('SELECT * FROM user_services WHERE user_id = ?', [userId]);
}

async function setUserService(userId, service, enabled = true) {
    await query(
        'INSERT INTO user_services (user_id, service, enabled) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE enabled = ?',
        [userId, service, enabled, enabled]
    );
}

module.exports = {
    getPool,
    query,
    getUserByEmail,
    getUserById,
    getUserByPlexUsername,
    createUser,
    updateUser,
    deleteUser,
    getAllUsers,
    getUsersByStatus,
    getUserServices,
    setUserService
};