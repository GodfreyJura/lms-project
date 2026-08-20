require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("./config/db");

const resetPassword = async () => {
    try {
        const email = "admin@lmsdemo.com";
        const newPassword = "Admin12345!";

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await pool.query(
            `UPDATE users
             SET password_hash = $1
             WHERE email = $2
             RETURNING id, email`,
            [hashedPassword, email]
        );

        if (result.rows.length === 0) {
            console.log("Admin account not found.");
        } else {
            console.log("Admin password reset successfully.");
            console.log("Email:", result.rows[0].email);
            console.log("New password:", newPassword);
        }
    } catch (error) {
        console.error("Password reset error:", error);
    } finally {
        await pool.end();
    }
};

resetPassword();