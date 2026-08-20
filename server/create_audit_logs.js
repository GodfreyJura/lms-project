require("dotenv").config();
const pool = require("./src/config/db");

const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_role VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100),
        resource_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("audit_logs table created successfully");
    process.exit();
  } catch (error) {
    console.error("Error creating table:", error.message);
    process.exit(1);
  }
};

createTable();