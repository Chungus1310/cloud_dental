/**
 * Cloud's Dental Hospital - Admin API Routes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { db } = require('../server');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        let uploadPath = 'images/';
        
        // Determine folder based on route
        if (req.originalUrl.includes('/doctors')) {
            uploadPath += 'doctors/';
        } else if (req.originalUrl.includes('/services')) {
            uploadPath += 'services/';
        } else if (req.originalUrl.includes('/testimonials')) {
            uploadPath += 'testimonials/';
        }
        
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'), false);
        }
    }
});

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const [totalBookings, totalDoctors, pendingBookings, totalTestimonials] = await Promise.all([
            db.get("SELECT COUNT(*) as count FROM bookings"),
            db.get("SELECT COUNT(*) as count FROM doctors"),
            db.get("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'"),
            db.get("SELECT COUNT(*) as count FROM testimonials")
        ]);

        res.json({
            totalBookings: totalBookings?.count || 0,
            totalDoctors: totalDoctors?.count || 0,
            pendingBookings: pendingBookings?.count || 0,
            totalTestimonials: totalTestimonials?.count || 0
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: "Error fetching admin statistics" });
    }
});

// Get all doctors
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await db.all(`
            SELECT d.*, 
                   GROUP_CONCAT(s.name) as services
            FROM doctors d
            LEFT JOIN doctor_services ds ON d.id = ds.doctor_id
            LEFT JOIN services s ON ds.service_id = s.id
            GROUP BY d.id
            ORDER BY d.name ASC
        `);
        res.json({ doctors });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: "Error fetching doctors" });
    }
});

// Get a specific doctor
router.get('/doctors/:id', async (req, res) => {
    try {
        const doctor = await db.get(
            "SELECT d.*, GROUP_CONCAT(ds.service_id) as service_ids FROM doctors d LEFT JOIN doctor_services ds ON d.id = ds.doctor_id WHERE d.id = ? GROUP BY d.id",
            [req.params.id]
        );
        
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        // Parse service IDs if they exist
        if (doctor.service_ids) {
            doctor.serviceIds = doctor.service_ids.split(',').map(id => parseInt(id));
        } else {
            doctor.serviceIds = [];
        }
        
        delete doctor.service_ids;
        
        res.json(doctor);
    } catch (error) {
        console.error('Error fetching doctor details:', error);
        res.status(500).json({ error: "Error fetching doctor details" });
    }
});

// Update a doctor
router.put('/doctors/:id', verifyToken, upload.single('image'), async (req, res) => {
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
            // Use image, not image_url, to match the database schema
            query += `, image = ?`;
            params.push(`/images/doctors/${req.file.filename}`);
        }

        query += ` WHERE id = ?`;
        params.push(doctorId);

        const result = await db.run(query, params);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        if (services) {
            try {
                // Clear existing services
                await db.run("DELETE FROM doctor_services WHERE doctor_id = ?", [doctorId]);
                
                // Add new services
                const servicesArray = JSON.parse(services);
                for (const serviceId of servicesArray) {
                    await db.run(
                        "INSERT INTO doctor_services (doctor_id, service_id) VALUES (?, ?)",
                        [doctorId, serviceId]
                    );
                }
            } catch (serviceErr) {
                console.error("Error updating doctor services:", serviceErr);
            }
        }

        res.json({ message: "Doctor updated successfully" });
    } catch (error) {
        console.error("Error updating doctor:", error);
        res.status(500).json({ error: "Error updating doctor: " + error.message });
    }
});

// Delete a doctor
router.delete('/doctors/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        
        // Check if doctor exists
        const doctor = await db.get("SELECT id FROM doctors WHERE id = ?", [doctorId]);
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }
        
        // Delete doctor-service relationships
        await db.run("DELETE FROM doctor_services WHERE doctor_id = ?", [doctorId]);
        
        // Delete doctor
        await db.run("DELETE FROM doctors WHERE id = ?", [doctorId]);
        
        res.json({ message: "Doctor deleted successfully" });
    } catch (error) {
        console.error('Error deleting doctor:', error);
        res.status(500).json({ error: "Error deleting doctor" });
    }
});

// Get all services
router.get('/services', async (req, res) => {
    try {
        const services = await db.all("SELECT * FROM services ORDER BY name ASC");
        res.json({ services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: "Error fetching services" });
    }
});

// Get a specific service
router.get('/services/:id', async (req, res) => {
    try {
        const service = await db.get("SELECT * FROM services WHERE id = ?", [req.params.id]);
        
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        
        res.json(service);
    } catch (error) {
        console.error('Error fetching service details:', error);
        res.status(500).json({ error: "Error fetching service details" });
    }
});

// Update a service
router.put('/services/:id', verifyToken, upload.single('image'), async (req, res) => {
    const { name, description, icon, category, duration } = req.body;
    const serviceId = req.params.id;
    
    if (!name || !description) {
        return res.status(400).json({ error: "Name and description are required" });
    }
    
    // Validate duration
    const parsedDuration = parseInt(duration);
    if (isNaN(parsedDuration) || parsedDuration < 15) {
        return res.status(400).json({ error: "Duration must be at least 15 minutes" });
    }
    
    try {
        // Check if service exists
        const service = await db.get("SELECT id FROM services WHERE id = ?", [serviceId]);
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        
        let query = `UPDATE services SET 
            name = ?, 
            description = ?, 
            icon = ?, 
            category = ?, 
            duration = ?`;
        let params = [name, description, icon, category || 'general', parsedDuration];

        if (req.file) {
            query += `, image = ?`;
            params.push(`/images/services/${req.file.filename}`);
        }

        query += ` WHERE id = ?`;
        params.push(serviceId);
        
        await db.run(query, params);
        
        res.json({ message: "Service updated successfully" });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: "Error updating service" });
    }
});

// Delete a service
router.delete('/services/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;
        
        // Check if service exists
        const service = await db.get("SELECT id FROM services WHERE id = ?", [serviceId]);
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        
        // Delete service-doctor relationships
        await db.run("DELETE FROM doctor_services WHERE service_id = ?", [serviceId]);
        
        // Delete service
        await db.run("DELETE FROM services WHERE id = ?", [serviceId]);
        
        res.json({ message: "Service deleted successfully" });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: "Error deleting service" });
    }
});

// Get testimonials with filter
router.get('/testimonials', async (req, res) => {
    try {
        const approved = req.query.approved === 'true';
        const testimonials = await db.all(
            "SELECT * FROM testimonials WHERE approved = ? ORDER BY created_at DESC",
            [approved ? 1 : 0]
        );
        res.json({ testimonials });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ error: "Error fetching testimonials" });
    }
});

// Get a specific testimonial
router.get('/testimonials/:id', async (req, res) => {
    try {
        const testimonial = await db.get("SELECT * FROM testimonials WHERE id = ?", [req.params.id]);
        
        if (!testimonial) {
            return res.status(404).json({ error: "Testimonial not found" });
        }
        
        res.json(testimonial);
    } catch (error) {
        console.error('Error fetching testimonial details:', error);
        res.status(500).json({ error: "Error fetching testimonial details" });
    }
});

// Update testimonial approval status
router.put('/testimonials/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if testimonial exists
        const testimonial = await db.get("SELECT id FROM testimonials WHERE id = ?", [id]);
        if (!testimonial) {
            return res.status(404).json({ error: "Testimonial not found" });
        }
        
        await db.run("UPDATE testimonials SET approved = 1 WHERE id = ?", [id]);
        res.json({ message: "Testimonial approved successfully" });
    } catch (error) {
        console.error('Error approving testimonial:', error);
        res.status(500).json({ error: "Error approving testimonial" });
    }
});

// Delete a testimonial
router.delete('/testimonials/:id', async (req, res) => {
    try {
        const testimonialId = req.params.id;
        
        // Check if testimonial exists
        const testimonial = await db.get("SELECT id FROM testimonials WHERE id = ?", [testimonialId]);
        if (!testimonial) {
            return res.status(404).json({ error: "Testimonial not found" });
        }
        
        // Delete testimonial
        await db.run("DELETE FROM testimonials WHERE id = ?", [testimonialId]);
        
        res.json({ message: "Testimonial deleted successfully" });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).json({ error: "Error deleting testimonial" });
    }
});

// Get all bookings with pagination and filters
router.get('/bookings', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const date = req.query.date;

        let query = `
            SELECT b.*, d.name as doctor_name
            FROM bookings b
            LEFT JOIN doctors d ON b.doctor_id = d.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += " AND b.status = ?";
            params.push(status);
        }
        if (date) {
            query += " AND b.booking_date = ?";
            params.push(date);
        }

        query += " ORDER BY b.created_at DESC LIMIT ? OFFSET ?";
        params.push(limit, offset);

        const bookings = await db.all(query, params);
        const total = await db.get("SELECT COUNT(*) as count FROM bookings");

        res.json({
            bookings,
            total: total.count,
            currentPage: page,
            totalPages: Math.ceil(total.count / limit)
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: "Error fetching bookings" });
    }
});

// Get a specific booking
router.get('/bookings/:id', async (req, res) => {
    try {
        const booking = await db.get(`
            SELECT 
                b.*,
                d.name as doctor_name,
                d.specialty as doctor_specialty
            FROM bookings b
            LEFT JOIN doctors d ON b.doctor_id = d.id
            WHERE b.id = ?
        `, [req.params.id]);

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Format the booking data
        const formattedBooking = {
            id: booking.id,
            patientName: booking.patient_name,
            doctorName: booking.doctor_name,
            service: booking.service,
            date: booking.booking_date,
            time: booking.booking_time,
            status: booking.status,
            email: booking.email,
            phone: booking.phone,
            notes: booking.notes,
            createdAt: booking.created_at
        };

        res.json(formattedBooking);
    } catch (error) {
        console.error('Error fetching booking details:', error);
        res.status(500).json({ error: "Error fetching booking details" });
    }
});

// Update booking status
router.put('/bookings/:id/status', async (req, res) => {
    const { status } = req.body;
    const bookingId = req.params.id;

    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    try {
        const result = await db.run(
            "UPDATE bookings SET status = ? WHERE id = ?",
            [status, bookingId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json({ message: "Booking status updated successfully" });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: "Error updating booking status" });
    }
});

// Get recent bookings
router.get('/recent-bookings', async (req, res) => {
    try {
        const bookings = await db.all(`
            SELECT 
                b.id,
                b.patient_name,
                b.email,
                b.phone,
                b.service,
                b.booking_date,
                b.booking_time,
                b.status,
                b.notes,
                b.created_at,
                d.name as doctor_name
            FROM bookings b
            LEFT JOIN doctors d ON b.doctor_id = d.id
            ORDER BY b.created_at DESC
            LIMIT 5
        `);

        // Format the data consistently
        const formattedBookings = bookings.map(booking => ({
            id: booking.id,
            patientName: booking.patient_name,
            email: booking.email,
            phone: booking.phone,
            service: booking.service,
            date: booking.booking_date,
            time: booking.booking_time,
            status: booking.status || 'pending',
            notes: booking.notes,
            doctorName: booking.doctor_name || 'N/A',
            createdAt: booking.created_at
        }));
        
        res.json({ bookings: formattedBookings });
    } catch (error) {
        res.status(500).json({ error: "Error fetching recent bookings" });
    }
});

// Change admin password
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminId = req.adminId; // Set by auth middleware

        const admin = await db.get(
            "SELECT * FROM admins WHERE id = ?",
            [adminId]
        );

        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run(
            "UPDATE admins SET password = ? WHERE id = ?",
            [hashedPassword, adminId]
        );

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: "Error changing password" });
    }
});

// Create a new doctor
router.post('/doctors', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name, specialty, email, bio, services } = req.body;
        // Use image, not image_url, to match the database schema
        const imagePath = req.file ? `/images/doctors/${req.file.filename}` : null;
        
        // Updated query with correct column name (image, not image_url)
        const result = await db.run(
            `INSERT INTO doctors (name, specialty, email, bio, image) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, specialty, email, bio || null, imagePath]
        );

        const doctorId = result.lastID;

        if (services) {
            try {
                const servicesArray = JSON.parse(services);
                for (const serviceId of servicesArray) {
                    await db.run(
                        "INSERT INTO doctor_services (doctor_id, service_id) VALUES (?, ?)",
                        [doctorId, serviceId]
                    );
                }
            } catch (serviceErr) {
                console.error("Error adding doctor services:", serviceErr);
            }
        }

        res.status(201).json({
            message: "Doctor added successfully",
            doctorId: doctorId
        });
    } catch (error) {
        console.error("Error creating doctor:", error);
        res.status(500).json({ error: "Error creating doctor: " + error.message });
    }
});

// Create a new service
router.post('/services', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name, description, icon, category, duration } = req.body;
        const imagePath = req.file ? `/images/services/${req.file.filename}` : null;
        
        // Validate duration
        const parsedDuration = parseInt(duration);
        if (isNaN(parsedDuration) || parsedDuration < 15) {
            return res.status(400).json({ error: "Duration must be at least 15 minutes" });
        }
        
        const result = await db.run(
            `INSERT INTO services (name, description, icon, category, duration, image) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description, icon, category || 'general', parsedDuration, imagePath]
        );

        res.status(201).json({
            message: "Service added successfully",
            serviceId: result.lastID
        });
    } catch (error) {
        console.error("Error creating service:", error);
        res.status(500).json({ error: "Error creating service: " + error.message });
    }
});

router.post('/testimonials', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name, title, content, rating } = req.body;
        // Use image, not image_url, to match the database schema
        const imagePath = req.file ? `/images/testimonials/${req.file.filename}` : null;
        
        // Updated query with correct column name (image, not image_url)
        const result = await db.run(
            `INSERT INTO testimonials (name, title, content, rating, image, approved) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, title, content, rating, imagePath, false]
        );

        res.status(201).json({
            message: "Testimonial added successfully",
            testimonialId: result.lastID
        });
    } catch (error) {
        console.error("Error creating testimonial:", error);
        res.status(500).json({ error: "Error creating testimonial: " + error.message });
    }
});

module.exports = router;