/**
 * Cloud's Dental Hospital - Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { db } = require('../server');

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: "No token provided" });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Store admin ID in request
        req.adminId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// Check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        const admin = await db.get(
            "SELECT id, username, name FROM admins WHERE id = ?",
            [req.adminId]
        );

        if (!admin) {
            return res.status(403).json({ error: "Admin access required" });
        }

        // Store admin info in request
        req.admin = admin;
        next();
    } catch (error) {
        res.status(500).json({ error: "Error verifying admin status" });
    }
};

module.exports = { verifyToken, isAdmin };