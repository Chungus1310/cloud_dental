/**
 * Cloud's Dental Hospital - Authentication API Routes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { db } = require('../server');

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Get admin from database
        const admin = await db.get('SELECT * FROM admins WHERE username = ?', [username]);
        
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check auth status
router.get('/check', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.json({ isAuthenticated: false });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get admin info
        const admin = await db.get(
            'SELECT id, username, name FROM admins WHERE id = ?',
            [decoded.id]
        );

        if (!admin) {
            return res.json({ isAuthenticated: false });
        }

        res.json({
            isAuthenticated: true,
            admin: {
                id: admin.id,
                username: admin.username,
                name: admin.name
            }
        });
    } catch (error) {
        res.json({ isAuthenticated: false });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;