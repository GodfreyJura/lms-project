require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("./config/db");

const resetPassword = async () => {
    try {
        const newPassword = "Instructor@123";

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const result = await pool.query(
            `UPDATE users
             SET password_hash = $1
             WHERE email = $2
             AND role_id = (
                 SELECT id
                 FROM roles
                 WHERE name = 'INSTRUCTOR'
             )
             RETURNING id, first_name, last_name, email`,
            [hashedPassword, "instructor@lmsdemo.com"]
        );

        if (result.rows.length === 0) {
            console.log("Instructor not found.");
            return;
        }

        console.log("Instructor password reset successfully.");
        console.log(result.rows[0]);
        console.log("New password:", newPassword);

    } catch (error) {
        console.error("Password reset error:", error);
    } finally {
        await pool.end();
    }
};

resetPassword();