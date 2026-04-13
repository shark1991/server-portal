-- Server Portal Database Schema
-- Run this to create the database and tables

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS server_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE server_portal;

-- Users table (local auth + Plex link)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plex_user_id VARCHAR(255) NULL,
    plex_username VARCHAR(255) NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('pending', 'approved', 'denied') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_plex_username (plex_username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service permissions per user
CREATE TABLE IF NOT EXISTS user_services (
    user_id INT NOT NULL,
    service ENUM('plex', 'overseerr', 'nextcloud') NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, service),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table for sessionstore
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    expires INT UNSIGNED,
    data TEXT,
    INDEX idx_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin user (default - change password!)
INSERT INTO users (email, username, password_hash, first_name, last_name, role, status)
VALUES ('eakinben@gmail.com', 'admin', '$2b$10$placeholder', 'Ben', 'Eakin', 'admin', 'approved')
ON DUPLICATE KEY UPDATE username = 'admin';