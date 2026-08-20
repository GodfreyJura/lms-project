require("dotenv").config();
const pool = require("./src/config/db");

const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("login_attempts table created successfully");
    process.exit();
  } catch (error) {
    console.error("Error creating table:", error.message);
    process.exit(1);
  }
};

createTable();