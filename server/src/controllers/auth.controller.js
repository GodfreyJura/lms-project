const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password complexity
 */
const validatePassword = (password) => {
    if (!password || password.length < 8) {
        return "Password must be at least 8 characters long";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }

    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number";
    }

    return null;
};

/**
 * Sanitize string input
 */
const sanitizeString = (value) => {
    if (!value || typeof value !== "string") {
        return "";
    }

    return value.trim().replace(/[<>]/g, "");
};

/**
 * Get client IP address
 */
const getClientIp = (req) => {
    return (
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        "unknown"
    );
};

/**
 * Check if account is locked due to too many failed attempts
 */
const isAccountLocked = async (institutionId, email) => {
    const lockoutTime = new Date(
        Date.now() - LOCKOUT_MINUTES * 60 * 1000
    );

    const result = await pool.query(
        `SELECT COUNT(*) AS failed_count
         FROM login_attempts
         WHERE institution_id = $1
         AND LOWER(email) = LOWER($2)
         AND success = FALSE
         AND attempt_time > $3`,
        [institutionId, email, lockoutTime]
    );

    return Number(result.rows[0].failed_count) >= MAX_FAILED_ATTEMPTS;
};

/**
 * Record a login attempt
 */
const recordLoginAttempt = async (
    institutionId,
    email,
    ipAddress,
    success
) => {
    await pool.query(
        `INSERT INTO login_attempts (
            institution_id,
            email,
            ip_address,
            success
        )
        VALUES ($1, $2, $3, $4)`,
        [institutionId, email, ipAddress, success]
    );
};

/**
 * Clear failed attempts after successful login
 */
const clearFailedAttempts = async (institutionId, email) => {
    await pool.query(
        `DELETE FROM login_attempts
         WHERE institution_id = $1
         AND LOWER(email) = LOWER($2)
         AND success = FALSE`,
        [institutionId, email]
    );
};

/**
 * REGISTER
 */
const register = async (req, res) => {
    try {
        const {
            institution_id,
            role_id,
            first_name,
            last_name,
            email,
            password
        } = req.body;

        if (
            !institution_id ||
            !role_id ||
            !first_name ||
            !last_name ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedFirstName = sanitizeString(first_name);
        const normalizedLastName = sanitizeString(last_name);

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        const passwordError = validatePassword(password);

        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        if (!normalizedFirstName || !normalizedLastName) {
            return res.status(400).json({
                success: false,
                message: "First name and last name cannot be empty"
            });
        }

        const existingUser = await pool.query(
            `SELECT id
             FROM users
             WHERE institution_id = $1
             AND LOWER(email) = $2`,
            [institution_id, normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (
                institution_id,
                role_id,
                first_name,
                last_name,
                email,
                password_hash
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                institution_id,
                role_id,
                first_name,
                last_name,
                email,
                is_active,
                email_verified,
                created_at`,
            [
                institution_id,
                role_id,
                normalizedFirstName,
                normalizedLastName,
                normalizedEmail,
                hashedPassword
            ]
        );

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during registration",
            error: error.message
        });
    }
};

/**
 * LOGIN
 */
const login = async (req, res) => {
    try {
        const {
            institution_id,
            email,
            password
        } = req.body;

        if (!institution_id || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Institution, email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const clientIp = getClientIp(req);

        // Check if account is locked
        const locked = await isAccountLocked(
            institution_id,
            normalizedEmail
        );

        if (locked) {
            return res.status(423).json({
                success: false,
                message: `Account temporarily locked. Try again in ${LOCKOUT_MINUTES} minutes.`
            });
        }

        // Find user
        const result = await pool.query(
            `SELECT
                u.id,
                u.institution_id,
                u.role_id,
                u.first_name,
                u.last_name,
                u.email,
                u.password_hash,
                u.is_active,
                u.email_verified,
                r.name AS role
             FROM users u
             INNER JOIN roles r
                ON u.role_id = r.id
             WHERE u.institution_id = $1
             AND LOWER(u.email) = $2`,
            [institution_id, normalizedEmail]
        );

        // User does not exist
        if (result.rows.length === 0) {
            await recordLoginAttempt(
                institution_id,
                normalizedEmail,
                clientIp,
                false
            );

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        // Account inactive
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "Account is inactive"
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            await recordLoginAttempt(
                institution_id,
                normalizedEmail,
                clientIp,
                false
            );

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Successful login
        await clearFailedAttempts(
            institution_id,
            normalizedEmail
        );

        await recordLoginAttempt(
            institution_id,
            normalizedEmail,
            clientIp,
            true
        );

        // Create JWT
        const token = jwt.sign(
            {
                id: user.id,
                institution_id: user.institution_id,
                role_id: user.role_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "24h"
            }
        );

        // Never send password hash to frontend
        delete user.password_hash;

        return res.json({
            success: true,
            message: "Login successful",
            token,
            expires_in: "24h",
            user
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login",
            error: error.message
        });
    }
};

module.exports = {
    register,
    login
};