/**
 * Cloud's Dental Hospital - Doctor API Routes
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
        cb(null, 'images/doctors/');
    },
    filename: function(req, file, cb) {
        cb(null, 'doctor-' + Date.now() + path.extname(file.originalname));
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

// Get all doctors with their services
router.get('/', async (req, res) => {
    try {
        // First get all doctors
        const doctors = await db.all(
            "SELECT id, name, specialty, bio, image, email, social_linkedin, social_twitter FROM doctors ORDER BY name ASC"
        );
        
        // For each doctor, get their services
        for (const doctor of doctors) {
            const doctorServices = await db.all(`
                SELECT s.id, s.name 
                FROM services s
                JOIN doctor_services ds ON s.id = ds.service_id
                WHERE ds.doctor_id = ?
            `, [doctor.id]);
            
            doctor.services = doctorServices.map(s => s.name);
            doctor.serviceIds = doctorServices.map(s => s.id);
        }
        
        res.json(doctors);
    } catch (err) {
        console.error('Error fetching doctors:', err);
        res.status(500).json({ error: "Error retrieving doctors" });
    }
});

// Get a specific doctor
router.get('/:id', async (req, res) => {
    try {
        const doctor = await db.get(
            "SELECT id, name, specialty, bio, image, email, social_linkedin, social_twitter FROM doctors WHERE id = ?",
            [req.params.id]
        );
        
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }
        
        // Get doctor's services
        const doctorServices = await db.all(`
            SELECT s.id, s.name 
            FROM services s
            JOIN doctor_services ds ON s.id = ds.service_id
            WHERE ds.doctor_id = ?
        `, [doctor.id]);
        
        doctor.services = doctorServices.map(s => s.name);
        doctor.serviceIds = doctorServices.map(s => s.id);
        
        res.json(doctor);
    } catch (err) {
        console.error('Error fetching doctor:', err);
        res.status(500).json({ error: "Error retrieving doctor" });
    }
});

// Get doctors by service
router.get('/by-service/:serviceId', async (req, res) => {
    try {
        const doctors = await db.all(`
            SELECT d.id, d.name, d.specialty, d.bio, d.image, d.email, d.social_linkedin, d.social_twitter
            FROM doctors d
            JOIN doctor_services ds ON d.id = ds.doctor_id
            WHERE ds.service_id = ?
            ORDER BY d.name ASC
        `, [req.params.serviceId]);
        
        res.json(doctors);
    } catch (err) {
        console.error('Error fetching doctors by service:', err);
        res.status(500).json({ error: "Error retrieving doctors" });
    }
});

// Get available time slots for a doctor
router.get('/:id/slots', async (req, res) => {
    const { date } = req.query;
    
    if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
    }
    
    try {
        // Generate all possible time slots
        const timeSlots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
            '16:00', '16:30', '17:00'
        ];
        
        // Get bookings for the doctor on the specified date
        const bookings = await db.all(
            `SELECT booking_time 
             FROM bookings 
             WHERE doctor_id = ? 
             AND booking_date = ?
             AND status != 'cancelled'`,
            [req.params.id, date]
        );
        
        // Create an array of booked times
        const bookedTimes = bookings.map(booking => booking.booking_time);
        
        // Create available slots
        const availableSlots = timeSlots.map(time => {
            return {
                time,
                available: !bookedTimes.includes(time),
                remainingSlots: bookedTimes.includes(time) ? 0 : 1
            };
        });
        
        res.json(availableSlots);
    } catch (err) {
        console.error('Error fetching time slots:', err);
        res.status(500).json({ error: "Error retrieving time slots" });
    }
});

// Admin: Create a new doctor with image upload
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name, specialty, email, bio, services } = req.body;
        const imagePath = req.file ? `/images/doctors/${req.file.filename}` : null;
        
        const result = await db.run(
            `INSERT INTO doctors (name, specialty, email, bio, image_url) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, specialty, email, bio || null, imagePath]
        );

        if (services) {
            const servicesArray = JSON.parse(services);
            for (const serviceId of servicesArray) {
                await db.run(
                    "INSERT INTO doctor_services (doctor_id, service_id) VALUES (?, ?)",
                    [result.lastID, serviceId]
                );
            }
        }

        res.status(201).json({
            message: "Doctor added successfully",
            doctorId: result.lastID
        });
    } catch (error) {
        res.status(500).json({
            error: "Error creating doctor"
        });
    }
});

// Admin: Update a doctor with image upload
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name, specialty, email, bio, services } = req.body;
        const doctorId = req.params.id;
        
        let query = `UPDATE doctors SET 
            name = ?, 
            specialty = ?, 
            email = ?, 
            bio = ?`;
        let params = [name, specialty, email, bio || null];

        if (req.file) {
            query += `, image_url = ?`;
            params.push(`/images/doctors/${req.file.filename}`);
        }

        query += ` WHERE id = ?`;
        params.push(doctorId);

        await db.run(query, params);

        if (services) {
            // Update services
            await db.run("DELETE FROM doctor_services WHERE doctor_id = ?", [doctorId]);
            const servicesArray = JSON.parse(services);
            for (const serviceId of servicesArray) {
                await db.run(
                    "INSERT INTO doctor_services (doctor_id, service_id) VALUES (?, ?)",
                    [doctorId, serviceId]
                );
            }
        }

        res.json({ message: "Doctor updated successfully" });
    } catch (error) {
        res.status(500).json({
            error: "Error updating doctor"
        });
    }
});

// Admin: Delete a doctor
router.delete('/:id', async (req, res) => {
    try {
        // Start a transaction
        await db.run('BEGIN TRANSACTION');
        
        // Delete doctor-service relationships
        await db.run(
            "DELETE FROM doctor_services WHERE doctor_id = ?",
            [req.params.id]
        );
        
        // Delete doctor
        const result = await db.run(
            "DELETE FROM doctors WHERE id = ?", 
            [req.params.id]
        );
        
        if (result.changes === 0) {
            await db.run('ROLLBACK');
            return res.status(404).json({ error: "Doctor not found" });
        }
        
        // Commit transaction
        await db.run('COMMIT');
        
        res.json({ message: "Doctor deleted successfully" });
    } catch (err) {
        // Rollback transaction in case of error
        await db.run('ROLLBACK');
        
        console.error('Error deleting doctor:', err);
        res.status(500).json({ error: "Error deleting doctor" });
    }
});

module.exports = router;