/**
 * Cloud's Dental Hospital - Testimonial API Routes
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
        cb(null, 'images/testimonials/');
    },
    filename: function(req, file, cb) {
        cb(null, 'testimonial-' + Date.now() + path.extname(file.originalname));
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

// Get all approved testimonials
router.get('/', async (req, res) => {
    try {
        const testimonials = await db.all(
            "SELECT * FROM testimonials WHERE approved = 1 ORDER BY created_at DESC"
        );
        res.json(testimonials);
    } catch (err) {
        console.error('Error fetching testimonials:', err);
        res.status(500).json({ error: "Error retrieving testimonials" });
    }
});

// Admin: Get all testimonials including unapproved ones
router.get('/admin', async (req, res) => {
    try {
        const testimonials = await db.all(
            "SELECT * FROM testimonials ORDER BY created_at DESC"
        );
        res.json(testimonials);
    } catch (err) {
        console.error('Error fetching testimonials:', err);
        res.status(500).json({ error: "Error retrieving testimonials" });
    }
});

// Create a new testimonial
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name, title, content, rating } = req.body;
        const imagePath = req.file ? `/images/testimonials/${req.file.filename}` : null;
        
        const result = await db.run(
            `INSERT INTO testimonials (name, title, content, rating, image, approved) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, title, content, rating, imagePath, 0]
        );

        res.status(201).json({
            message: "Testimonial added successfully",
            testimonialId: result.lastID
        });
    } catch (error) {
        console.error('Error creating testimonial:', error);
        res.status(500).json({
            error: "Error creating testimonial"
        });
    }
});

// Update a testimonial
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name, title, content, rating } = req.body;
        const testimonialId = req.params.id;
        
        let query = `UPDATE testimonials SET 
            name = ?, 
            title = ?, 
            content = ?, 
            rating = ?`;
        let params = [name, title, content, rating];

        if (req.file) {
            query += `, image = ?`;
            params.push(`/images/testimonials/${req.file.filename}`);
        }

        query += ` WHERE id = ?`;
        params.push(testimonialId);

        const result = await db.run(query, params);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: "Testimonial not found" });
        }

        res.json({ message: "Testimonial updated successfully" });
    } catch (error) {
        console.error('Error updating testimonial:', error);
        res.status(500).json({
            error: "Error updating testimonial"
        });
    }
});

// Admin: Approve or disapprove a testimonial
router.put('/:id/approve', verifyToken, async (req, res) => {
    const { approved } = req.body;
    
    if (approved === undefined) {
        return res.status(400).json({ error: "Approved status is required" });
    }
    
    try {
        const result = await db.run(
            "UPDATE testimonials SET approved = ? WHERE id = ?",
            [approved ? 1 : 0, req.params.id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: "Testimonial not found" });
        }
        
        res.json({ 
            message: approved 
                ? "Testimonial approved successfully" 
                : "Testimonial disapproved"
        });
    } catch (err) {
        console.error('Error updating testimonial approval:', err);
        res.status(500).json({ error: "Error updating testimonial approval status" });
    }
});

// Admin: Delete a testimonial
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.run(
            "DELETE FROM testimonials WHERE id = ?", 
            [req.params.id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: "Testimonial not found" });
        }
        
        res.json({ message: "Testimonial deleted successfully" });
    } catch (err) {
        console.error('Error deleting testimonial:', err);
        res.status(500).json({ error: "Error deleting testimonial" });
    }
});

// Get pending testimonials
router.get('/pending', verifyToken, async (req, res) => {
    try {
        const testimonials = await db.all(
            "SELECT * FROM testimonials WHERE approved = 0 ORDER BY created_at DESC"
        );
        res.json({ testimonials });
    } catch (error) {
        res.status(500).json({
            error: "Error fetching pending testimonials"
        });
    }
});

// Get approved testimonials
router.get('/approved', verifyToken, async (req, res) => {
    try {
        const testimonials = await db.all(
            "SELECT * FROM testimonials WHERE approved = 1 ORDER BY created_at DESC"
        );
        res.json({ testimonials });
    } catch (error) {
        res.status(500).json({
            error: "Error fetching approved testimonials"
        });
    }
});

module.exports = router;