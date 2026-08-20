require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("./config/db");

const resetPassword = async () => {
    try {
        const email = "godfrey@student.com";
        const newPassword = "Student@123";

        const passwordHash = await bcrypt.hash(newPassword, 12);

        const result = await pool.query(
            `UPDATE users
             SET password_hash = $1
             WHERE email = $2
             RETURNING id, email`,
            [passwordHash, email]
        );

        if (result.rows.length === 0) {
            console.log("Student not found");
            return;
        }

        console.log("Password reset successfully");
        console.log(`Student: ${result.rows[0].email}`);
    } catch (error) {
        console.error("Password reset error:", error);
    } finally {
        await pool.end();
    }
};

resetPassword();