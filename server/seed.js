/**
 * Cloud's Dental Hospital - Database Seeder
 * This script creates all necessary database tables and populates them with initial data
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Set up database path
const dbPath = path.join(__dirname, 'database.sqlite');

// Create a new database file if it doesn't exist
const dbExists = fs.existsSync(dbPath);
if (!dbExists) {
  console.log('Creating new database file...');
  fs.writeFileSync(dbPath, '');
}

// Connect to database
const db = new sqlite3.Database(dbPath);

// Initial data
const services = [
    {
        name: "Perawatan Gigi Umum",
        description: "Layanan perawatan gigi rutin untuk mencegah masalah gigi dan menjaga kesehatan mulut Anda.",
        icon: "fas fa-tooth",
        category: "preventive",
        duration: "30",
        image: "/images/services/general-dentistry.jpg"
    },
    {
        name: "Ortodontik",
        description: "Perawatan untuk mengoreksi gigi yang tidak rata dan masalah gigitan dengan teknologi terbaru.",
        icon: "fas fa-teeth",
        category: "cosmetic",
        duration: "45-60"
    },
    {
        name: "Bedah Mulut",
        description: "Prosedur bedah mulut seperti pencabutan gigi bungsu dan implant gigi dengan standar tertinggi.",
        icon: "fas fa-teeth-open",
        category: "surgical",
        duration: "60-120"
    },
    {
        name: "Estetika Gigi",
        description: "Layanan untuk meningkatkan penampilan senyuman Anda, termasuk veneer dan pemutihan gigi.",
        icon: "fas fa-smile",
        category: "cosmetic",
        duration: "60-90"
    },
    {
        name: "Perawatan Saluran Akar",
        description: "Penanganan infeksi pada saluran akar gigi dengan teknologi modern dan minim rasa sakit.",
        icon: "fas fa-tooth",
        category: "surgical",
        duration: "90-120"
    },
    {
        name: "Gigi Anak",
        description: "Perawatan gigi khusus untuk anak-anak dengan pendekatan yang ramah dan menyenangkan.",
        icon: "fas fa-child",
        category: "pediatric",
        duration: "30-45"
    }
];

const doctors = [
    {
        name: "drg. Aditya Wijaya, Sp.Pros",
        specialty: "Spesialis Prostodonsia",
        bio: "Spesialis prostodonsia dengan pengalaman lebih dari 10 tahun dalam pembuatan gigi tiruan dan restorasi gigi.",
        image: "/images/doctor-1.jpg",
        email: "aditya.wijaya@cloudsdental.id",
        social_linkedin: "https://linkedin.com/in/aditya-wijaya",
        social_twitter: "https://twitter.com/drg_aditya"
    },
    {
        name: "drg. Siti Rahayu, Sp.Ort",
        specialty: "Spesialis Ortodonti",
        bio: "Ahli ortodonti yang berpengalaman dalam perawatan kawat gigi dan aligners.",
        image: "/images/doctor-2.jpg",
        email: "siti.rahayu@cloudsdental.id",
        social_linkedin: "https://linkedin.com/in/siti-rahayu",
        social_twitter: "https://twitter.com/drg_siti"
    },
    {
        name: "drg. Budi Santoso, Sp.BM",
        specialty: "Spesialis Bedah Mulut",
        bio: "Spesialis bedah mulut dengan keahlian dalam implant gigi dan bedah orthognathic.",
        image: "/images/doctor-3.jpg",
        email: "budi.santoso@cloudsdental.id",
        social_linkedin: "https://linkedin.com/in/budi-santoso",
        social_twitter: "https://twitter.com/drg_budi"
    },
    {
        name: "drg. Maya Indah",
        specialty: "Dokter Gigi Anak",
        bio: "Dokter gigi dengan pendekatan khusus untuk anak-anak dan remaja.",
        image: "/images/doctor-4.jpg",
        email: "maya.indah@cloudsdental.id",
        social_linkedin: "https://linkedin.com/in/maya-indah",
        social_twitter: "https://twitter.com/drg_maya"
    }
];

const testimonials = [
    {
        name: "Anisa Wijaya",
        title: "Pasien",
        content: "Saya tidak bisa mengungkapkan betapa bersyukurnya saya atas perawatan yang saya terima di Cloud's Dental Hospital. Para dokter gigi dan staf tidak hanya profesional tetapi juga penuh kasih sepanjang perawatan saya.",
        image: "/images/testimonial-1.jpg",
        approved: 1
    },
    {
        name: "Budi Santoso",
        title: "Pasien",
        content: "Pengalaman saya di Cloud's Dental Hospital luar biasa. Fasilitas sangat modern, dan tim medis memberikan informasi yang jelas tentang kondisi dan pilihan perawatan gigi saya.",
        image: "/images/testimonial-2.jpg",
        approved: 1
    },
    {
        name: "Dewi Rahman",
        title: "Pasien",
        content: "Sebagai seseorang yang cemas tentang kunjungan ke dokter gigi, saya sangat senang dengan suasana yang nyaman di Cloud's Dental Hospital. Staf sangat membantu dan memastikan kenyamanan saya selama perawatan.",
        image: "/images/testimonial-3.jpg",
        approved: 1
    }
];

// Convert callback-style functions to Promise-style
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, function(err, row) {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, function(err, rows) {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

// Main seeding function
async function seedDatabase() {
    try {
        // Create tables if they don't exist
        console.log('Creating database tables...');
        
        // Create admins table
        await run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create doctors table
        await run(`
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

        // Create services table
        await run(`
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

        // Create doctor_services junction table
        await run(`
            CREATE TABLE IF NOT EXISTS doctor_services (
                doctor_id INTEGER,
                service_id INTEGER,
                FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
                PRIMARY KEY (doctor_id, service_id)
            )
        `);

        // Create bookings table
        await run(`
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
                FOREIGN KEY (doctor_id) REFERENCES doctors(id)
            )
        `);

        // Create testimonials table
        await run(`
            CREATE TABLE IF NOT EXISTS testimonials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                title TEXT,
                content TEXT NOT NULL,
                image TEXT,
                approved BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Tables created successfully!');

        // Create admin user
        console.log('Creating admin user...');
        const adminExists = await get("SELECT * FROM admins WHERE username = ?", ['admin']);
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await run(
                "INSERT INTO admins (username, password, name) VALUES (?, ?, ?)",
                ['admin', hashedPassword, 'Administrator']
            );
        } else {
            console.log('Admin user already exists, skipping...');
        }

        // Insert services
        console.log('Seeding services...');
        for (const service of services) {
            const existingService = await get("SELECT id FROM services WHERE name = ?", [service.name]);
            
            if (!existingService) {
                await run(
                    "INSERT INTO services (name, description, icon, category, duration, image) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        service.name,
                        service.description,
                        service.icon,
                        service.category,
                        parseInt(service.duration) || 30,
                        service.image || null
                    ]
                );
            }
        }

        // Insert doctors
        console.log('Seeding doctors...');
        for (const doctor of doctors) {
            const existingDoctor = await get("SELECT id FROM doctors WHERE name = ?", [doctor.name]);
            
            let doctorId;
            if (!existingDoctor) {
                const result = await run(
                    `INSERT INTO doctors (name, specialty, bio, image, email, social_linkedin, social_twitter)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [doctor.name, doctor.specialty, doctor.bio, doctor.image, 
                     doctor.email, doctor.social_linkedin, doctor.social_twitter]
                );
                doctorId = result.lastID;
            } else {
                doctorId = existingDoctor.id;
            }
        }

        // Insert testimonials
        console.log('Seeding testimonials...');
        for (const testimonial of testimonials) {
            const existingTestimonial = await get("SELECT id FROM testimonials WHERE name = ? AND content = ?", [testimonial.name, testimonial.content]);
            
            if (!existingTestimonial) {
                await run(
                    "INSERT INTO testimonials (name, title, content, image, approved) VALUES (?, ?, ?, ?, ?)",
                    [testimonial.name, testimonial.title, testimonial.content, testimonial.image, testimonial.approved]
                );
            }
        }

        // Create doctor-service relationships
        console.log('Creating doctor-service relationships...');
        
        // Helper function to find doctor and service IDs and create relationship
        async function associateDoctorWithServices(doctorName, serviceNames) {
            const doctor = await get("SELECT id FROM doctors WHERE name LIKE ?", [`%${doctorName}%`]);
            if (!doctor) return;

            for (const serviceName of serviceNames) {
                const service = await get("SELECT id FROM services WHERE name LIKE ?", [`%${serviceName}%`]);
                if (!service) continue;

                // Check if relationship already exists
                const existing = await get(
                    "SELECT 1 FROM doctor_services WHERE doctor_id = ? AND service_id = ?",
                    [doctor.id, service.id]
                );

                if (!existing) {
                    await run(
                        "INSERT INTO doctor_services (doctor_id, service_id) VALUES (?, ?)",
                        [doctor.id, service.id]
                    );
                }
            }
        }

        // Associate doctors with services
        await associateDoctorWithServices("Aditya", ["Perawatan Gigi Umum", "Estetika Gigi"]);
        await associateDoctorWithServices("Siti", ["Ortodontik"]);
        await associateDoctorWithServices("Budi", ["Bedah Mulut", "Perawatan Saluran Akar"]);
        await associateDoctorWithServices("Maya", ["Gigi Anak"]);

        console.log('Database seeded successfully!');
        console.log('Default admin credentials:');
        console.log('Username: admin');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // Close the database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

// Run the seeder
seedDatabase();