const pool = require("../config/db");

/**
 * Record an audit log entry
 * 
 * @param {Object} params
 * @param {Object} params.user - The authenticated user (req.user)
 * @param {string} params.action - Action performed (e.g., "CREATE_USER", "DELETE_COURSE")
 * @param {string} params.resourceType - Type of resource (e.g., "USER", "COURSE")
 * @param {string} params.resourceId - ID of the resource (optional)
 * @param {Object} params.details - Additional details (optional)
 * @param {string} params.ipAddress - Client IP address (optional)
 */
const recordAuditLog = async ({
  user,
  action,
  resourceType,
  resourceId = null,
  details = null,
  ipAddress = null
}) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (
        institution_id,
        user_id,
        user_role,
        action,
        resource_type,
        resource_id,
        details,
        ip_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user.institution_id,
        user.id,
        user.role,
        action,
        resourceType,
        resourceId,
        details ? JSON.stringify(details) : null,
        ipAddress
      ]
    );
  } catch (error) {
    console.error("Audit log error:", error.message);
    // Don't throw - audit logging should not break the main operation
  }
};

/**
 * Get client IP address from request
 */
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null
  );
};

module.exports = {
  recordAuditLog,
  getClientIp
};