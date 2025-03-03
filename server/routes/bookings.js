/**
 * Cloud's Dental Hospital - Booking API Routes
 */

const express = require('express');
const router = express.Router();
const { db } = require('../server');
const { google } = require('googleapis');

// Get all bookings (admin only)
router.get('/', async (req, res) => {
    try {
        const bookings = await db.all(
            `SELECT b.*, d.name as doctor_name 
             FROM bookings b
             JOIN doctors d ON b.doctor_id = d.id
             ORDER BY b.booking_date DESC, b.booking_time ASC`
        );
        res.json(bookings);
    } catch (error) {
        res.status(500).json({
            error: "Error retrieving bookings"
        });
    }
});

// Get bookings for a specific doctor (admin only)
router.get('/doctor/:doctorId', (req, res) => {
  db.all(
    "SELECT * FROM bookings WHERE doctor_id = ? ORDER BY booking_date DESC, booking_time ASC",
    [req.params.doctorId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Error retrieving bookings" });
      }
      res.json(rows);
    }
  );
});

// Get a specific booking by ID (admin only)
router.get('/:id', async (req, res) => {
    try {
        const booking = await db.get(
            `SELECT b.*, d.name as doctor_name 
             FROM bookings b
             JOIN doctors d ON b.doctor_id = d.id
             WHERE b.id = ?`,
            [req.params.id]
        );

        if (!booking) {
            return res.status(404).json({
                error: "Booking not found"
            });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({
            error: "Error retrieving booking"
        });
    }
});

// Create a new booking
router.post('/', async (req, res) => {
    const { 
        fullName, email, phone, service,
        doctor_id, booking_date, booking_time,
        additionalInfo 
    } = req.body;

    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || 
        !service?.trim() || !doctor_id || !booking_date || !booking_time) {
        return res.status(400).json({
            error: "Please fill in all required fields"
        });
    }

    try {
        const doctor = await db.get(
            "SELECT id, name FROM doctors WHERE id = ?",
            [doctor_id]
        );

        if (!doctor) {
            return res.status(400).json({
                error: "Selected doctor not found"
            });
        }

        const existingBooking = await db.get(
            `SELECT id FROM bookings 
             WHERE doctor_id = ? 
             AND booking_date = ? 
             AND booking_time = ? 
             AND status != 'cancelled'`,
            [doctor_id, booking_date, booking_time]
        );

        if (existingBooking) {
            return res.status(400).json({
                error: "This time slot is no longer available"
            });
        }

        const result = await db.run(
            `INSERT INTO bookings (
                patient_name, email, phone, service,
                doctor_id, booking_date, booking_time,
                notes, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
            [fullName, email, phone, service, doctor_id, 
             booking_date, booking_time, additionalInfo || null]
        );

        res.status(201).json({
            message: "Booking created successfully",
            bookingId: result.lastID
        });

    } catch (error) {
        res.status(500).json({
            error: "An error occurred while creating your booking"
        });
    }
});

// Update a booking status (admin only)
router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            error: "Invalid status value"
        });
    }

    try {
        const result = await db.run(
            "UPDATE bookings SET status = ? WHERE id = ?",
            [status, req.params.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Booking not found"
            });
        }

        res.json({
            message: "Booking status updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            error: "Error updating booking status"
        });
    }
});

// Delete a booking (admin only)
router.delete('/:id', (req, res) => {
  db.run("DELETE FROM bookings WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: "Error deleting booking" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    res.json({ message: "Booking deleted successfully" });
  });
});

module.exports = router;