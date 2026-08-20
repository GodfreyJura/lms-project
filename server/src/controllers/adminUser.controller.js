const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { recordAuditLog, getClientIp } = require("../utils/auditLogger");

const getAdminUsers = async (req, res) => {
    try {
        const institutionId = req.user.institution_id;

        const result = await pool.query(
            `SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                r.name AS role,
                u.is_active,
                u.email_verified,
                u.created_at,
                u.updated_at
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.institution_id = $1
             ORDER BY u.created_at DESC`,
            [institutionId]
        );

        return res.json({
            success: true,
            count: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        console.error("Get admin users error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching users"
        });
    }
};

const getAdminUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const institutionId = req.user.institution_id;

        const result = await pool.query(
            `SELECT
                u.id,
                u.institution_id,
                u.first_name,
                u.last_name,
                u.email,
                r.id AS role_id,
                r.name AS role,
                r.description AS role_description,
                u.is_active,
                u.email_verified,
                u.created_at,
                u.updated_at
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.id = $1
             AND u.institution_id = $2`,
            [userId, institutionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error("Get admin user by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching user"
        });
    }
};

const createAdminUser = async (req, res) => {
    try {
        const {
            role_id,
            first_name,
            last_name,
            email,
            password
        } = req.body;

        const institutionId = req.user.institution_id;

        if (
            !role_id ||
            !first_name ||
            !last_name ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Role, first name, last name, email and password are required"
            });
        }

        const roleResult = await pool.query(
            `SELECT id
             FROM roles
             WHERE id = $1`,
            [role_id]
        );

        if (roleResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await pool.query(
            `SELECT id
             FROM users
             WHERE institution_id = $1
             AND LOWER(email) = $2`,
            [institutionId, normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists"
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
                created_at,
                updated_at`,
            [
                institutionId,
                role_id,
                first_name.trim(),
                last_name.trim(),
                normalizedEmail,
                hashedPassword
            ]
        );

        // Audit log
        await recordAuditLog({
            user: req.user,
            action: "CREATE_USER",
            resourceType: "USER",
            resourceId: result.rows[0].id,
            details: {
                email: normalizedEmail,
                role_id: role_id
            },
            ipAddress: getClientIp(req)
        });

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: result.rows[0]
        });
    } catch (error) {
        console.error("Create admin user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating user"
        });
    }
};

const updateAdminUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            role_id,
            first_name,
            last_name,
            email,
            password,
            is_active,
            email_verified
        } = req.body;

        const institutionId = req.user.institution_id;

        const existingUser = await pool.query(
            `SELECT id
             FROM users
             WHERE id = $1
             AND institution_id = $2`,
            [userId, institutionId]
        );

        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (role_id !== undefined) {
            const roleResult = await pool.query(
                `SELECT id
                 FROM roles
                 WHERE id = $1`,
                [role_id]
            );

            if (roleResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role"
                });
            }
        }

        let normalizedEmail;

        if (email !== undefined) {
            normalizedEmail = email.trim().toLowerCase();

            const emailResult = await pool.query(
                `SELECT id
                 FROM users
                 WHERE institution_id = $1
                 AND LOWER(email) = $2
                 AND id <> $3`,
                [institutionId, normalizedEmail, userId]
            );

            if (emailResult.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "A user with this email already exists"
                });
            }
        }

        const fields = [];
        const values = [];
        let index = 1;

        if (role_id !== undefined) {
            fields.push(`role_id = $${index++}`);
            values.push(role_id);
        }

        if (first_name !== undefined) {
            fields.push(`first_name = $${index++}`);
            values.push(first_name.trim());
        }

        if (last_name !== undefined) {
            fields.push(`last_name = $${index++}`);
            values.push(last_name.trim());
        }

        if (email !== undefined) {
            fields.push(`email = $${index++}`);
            values.push(normalizedEmail);
        }

        if (is_active !== undefined) {
            fields.push(`is_active = $${index++}`);
            values.push(is_active);
        }

        if (email_verified !== undefined) {
            fields.push(`email_verified = $${index++}`);
            values.push(email_verified);
        }

        if (password !== undefined) {
            const hashedPassword = await bcrypt.hash(password, 12);

            fields.push(`password_hash = $${index++}`);
            values.push(hashedPassword);
        }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update"
            });
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");

        values.push(userId);
        const userIdIndex = index++;

        values.push(institutionId);
        const institutionIdIndex = index++;

        const result = await pool.query(
            `UPDATE users
             SET ${fields.join(", ")}
             WHERE id = $${userIdIndex}
             AND institution_id = $${institutionIdIndex}
             RETURNING
                id,
                institution_id,
                role_id,
                first_name,
                last_name,
                email,
                is_active,
                email_verified,
                created_at,
                updated_at`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Audit log
        await recordAuditLog({
            user: req.user,
            action: "UPDATE_USER",
            resourceType: "USER",
            resourceId: userId,
            details: {
                email: result.rows[0].email,
                updated_fields: Object.keys(req.body)
            },
            ipAddress: getClientIp(req)
        });

        return res.json({
            success: true,
            message: "User updated successfully",
            user: result.rows[0]
        });
    } catch (error) {
        console.error("Update admin user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating user"
        });
    }
};

const deactivateAdminUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const institutionId = req.user.institution_id;

        const existingUser = await pool.query(
            `SELECT id, is_active
             FROM users
             WHERE id = $1
             AND institution_id = $2`,
            [userId, institutionId]
        );

        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!existingUser.rows[0].is_active) {
            return res.status(400).json({
                success: false,
                message: "User is already inactive"
            });
        }

        const result = await pool.query(
            `UPDATE users
             SET
                is_active = FALSE,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             AND institution_id = $2
             RETURNING
                id,
                institution_id,
                role_id,
                first_name,
                last_name,
                email,
                is_active,
                email_verified,
                created_at,
                updated_at`,
            [userId, institutionId]
        );

        // Audit log
        await recordAuditLog({
            user: req.user,
            action: "DEACTIVATE_USER",
            resourceType: "USER",
            resourceId: userId,
            details: {
                email: result.rows[0].email
            },
            ipAddress: getClientIp(req)
        });

        return res.json({
            success: true,
            message: "User deactivated successfully",
            user: result.rows[0]
        });
    } catch (error) {
        console.error("Deactivate admin user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deactivating user"
        });
    }
};

const reactivateAdminUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const institutionId = req.user.institution_id;

        const existingUser = await pool.query(
            `SELECT id, is_active
             FROM users
             WHERE id = $1
             AND institution_id = $2`,
            [userId, institutionId]
        );

        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (existingUser.rows[0].is_active) {
            return res.status(400).json({
                success: false,
                message: "User is already active"
            });
        }

        const result = await pool.query(
            `UPDATE users
             SET
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             AND institution_id = $2
             RETURNING
                id,
                institution_id,
                role_id,
                first_name,
                last_name,
                email,
                is_active,
                email_verified,
                created_at,
                updated_at`,
            [userId, institutionId]
        );

        // Audit log
        await recordAuditLog({
            user: req.user,
            action: "REACTIVATE_USER",
            resourceType: "USER",
            resourceId: userId,
            details: {
                email: result.rows[0].email
            },
            ipAddress: getClientIp(req)
        });

        return res.json({
            success: true,
            message: "User reactivated successfully",
            user: result.rows[0]
        });
    } catch (error) {
        console.error("Reactivate admin user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while reactivating user"
        });
    }
};

module.exports = {
    getAdminUsers,
    getAdminUserById,
    createAdminUser,
    updateAdminUser,
    deactivateAdminUser,
    reactivateAdminUser
};