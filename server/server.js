/**
 * Cloud's Dental Hospital - Backend Server
 */

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize database connection
const dbPath = path.join(__dirname, 'database.sqlite');
const dbInstance = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        initializeDatabase();
    }
});

// Create a database wrapper for promises
const db = {
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            dbInstance.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            dbInstance.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            dbInstance.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
};

// Export database wrapper for use in routes
module.exports = { db };

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'cloud-dental-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));
// Serve uploaded images
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// Database initialization function
async function initializeDatabase() {
    try {
        // Create tables if they don't exist
        await db.run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create doctors table
        await db.run(`
            CREATE TABLE IF NOT EXISTS doctors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                specialty TEXT NOT NULL,
                bio TEXT,
                image TEXT,
                email TEXT UNIQUE,
                social_linkedin TEXT,
                social_twitter TEXT,
                calendar_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create services table with image column
        await db.run(`
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                icon TEXT,
                image TEXT,
                category TEXT DEFAULT 'general',
                duration INTEGER DEFAULT 30,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check for the image column in services table
        try {
            const servicesTableInfo = await db.all("PRAGMA table_info(services)");
            const hasImageColumn = servicesTableInfo.some(info => info.name === 'image');

            if (!hasImageColumn) {
                await db.run("ALTER TABLE services ADD COLUMN image TEXT");
                console.log("Added 'image' column to services table");
            }
        } catch (error) {
            console.error("Failed to add 'image' column:", error);
        }

        // Create testimonials table with rating column
        await db.run(`
            CREATE TABLE IF NOT EXISTS testimonials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                title TEXT,
                content TEXT NOT NULL,
                rating TEXT,
                image TEXT,
                approved BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create doctor_services junction table
        await db.run(`
            CREATE TABLE IF NOT EXISTS doctor_services (
                doctor_id INTEGER,
                service_id INTEGER,
                FOREIGN KEY (doctor_id) REFERENCES doctors (id),
                FOREIGN KEY (service_id) REFERENCES services (id),
                PRIMARY KEY (doctor_id, service_id)
            )
        `);

        // Create bookings table
        await db.run(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                service TEXT NOT NULL,
                doctor_id INTEGER NOT NULL,
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                notes TEXT,
                status TEXT DEFAULT 'pending',
                calendar_event_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (doctor_id) REFERENCES doctors (id)
            )
        `);
        
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Import middleware after exporting db
const { verifyToken, verifySession, isAdmin } = require('./middleware/auth');

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', verifyToken, isAdmin, require('./routes/admin'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/testimonials', require('./routes/testimonials'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something broke!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Handle 404 errors
app.use((req, res) => {
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, '../404.html'));
        return;
    }
    res.status(404).json({ error: "Not found" });
});

// Start server
app.listen(port, () => {
    initializeDatabase();
});