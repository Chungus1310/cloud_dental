const { db } = require('../server');

async function migrate() {
    try {
        // Check if rating column exists
        const tableInfo = await db.all("PRAGMA table_info(testimonials)");
        const hasRating = tableInfo.some(col => col.name === 'rating');
        
        if (!hasRating) {
            // SQLite doesn't support ADD COLUMN with DEFAULT in a single statement
            await db.run("ALTER TABLE testimonials ADD COLUMN rating TEXT");
            console.log('Successfully added rating column to testimonials table');
        } else {
            console.log('Rating column already exists');
        }
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrate().then(() => process.exit(0));
}

module.exports = migrate;