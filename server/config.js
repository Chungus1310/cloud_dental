// Server Configuration
module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'clouds-dental-secret-key-2024',
    DATABASE_PATH: './database.sqlite'
};