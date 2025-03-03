/**
 * Cloud's Dental Hospital - Services API Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { db } = require('../server');
const { verifyToken } = require('../middleware/auth');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images/services/');
    },
    filename: function(req, file, cb) {
        cb(null, 'service-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// Get all services
router.get('/', async (req, res) => {
    try {
        const services = await db.all("SELECT * FROM services ORDER BY name ASC");
        res.json(services);
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).json({ error: "Error retrieving services" });
    }
});

// Get a specific service
router.get('/:id', async (req, res) => {
    try {
        const service = await db.get("SELECT * FROM services WHERE id = ?", [req.params.id]);
        
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        
        res.json(service);
    } catch (err) {
        console.error('Error fetching service:', err);
        res.status(500).json({ error: "Error retrieving service" });
    }
});

// Get services by category
router.get('/category/:category', async (req, res) => {
    try {
        const services = await db.all(
            "SELECT * FROM services WHERE category = ? ORDER BY name ASC",
            [req.params.category]
        );
        res.json(services);
    } catch (err) {
        console.error('Error fetching services by category:', err);
        res.status(500).json({ error: "Error retrieving services" });
    }
});

// Admin: Create a new service with image upload
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name, description, icon, category, duration } = req.body;
        const imagePath = req.file ? `/images/services/${req.file.filename}` : null;
        
        // Use 'image' column name consistently
        const result = await db.run(
            `INSERT INTO services (name, description, icon, category, duration, image) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description, icon, category || 'general', parseInt(duration) || 30, imagePath]
        );

        res.status(201).json({
            message: "Service added successfully",
            serviceId: result.lastID
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({
            error: "Error creating service"
        });
    }
});

// Admin: Update a service with image upload
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name, description, icon, category, duration } = req.body;
        const serviceId = req.params.id;
        
        let query = `UPDATE services SET 
            name = ?, 
            description = ?, 
            icon = ?, 
            category = ?, 
            duration = ?`;
        let params = [name, description, icon, category || 'general', parseInt(duration) || 30];

        if (req.file) {
            query += `, image = ?`; // Use 'image' consistently
            params.push(`/images/services/${req.file.filename}`);
        }

        query += ` WHERE id = ?`;
        params.push(serviceId);

        const result = await db.run(query, params);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: "Service not found" });
        }

        res.json({ message: "Service updated successfully" });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({
            error: "Error updating service"
        });
    }
});

// Admin: Delete a service
router.delete('/:id', async (req, res) => {
    try {
        // First delete any doctor-service relationships
        await db.run("DELETE FROM doctor_services WHERE service_id = ?", [req.params.id]);
        
        // Then delete the service
        const result = await db.run("DELETE FROM services WHERE id = ?", [req.params.id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: "Service not found" });
        }
        
        res.json({ message: "Service deleted successfully" });
    } catch (err) {
        console.error('Error deleting service:', err);
        res.status(500).json({ error: "Error deleting service" });
    }
});

module.exports = router;