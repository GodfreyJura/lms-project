
const pool = require("../config/db");

const getAdminDashboard = async (req, res) => {
    try {
        const institutionId = req.user.institution_id;

        const institution = await pool.query(
            `SELECT
                id,
                name,
                slug,
                created_at
             FROM institutions
             WHERE id = $1`,
            [institutionId]
        );

        if (institution.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Institution not found"
            });
        }

        const userStats = await pool.query(
            `SELECT
                COUNT(*) AS total_users,
                COUNT(*) FILTER (WHERE r.name = 'STUDENT') AS total_students,
                COUNT(*) FILTER (WHERE r.name = 'INSTRUCTOR') AS total_instructors,
                COUNT(*) FILTER (WHERE r.name = 'ADMIN') AS total_admins,
                COUNT(*) FILTER (WHERE u.is_active = TRUE) AS active_users
             FROM users u
             JOIN roles r
                ON u.role_id = r.id
             WHERE u.institution_id = $1`,
            [institutionId]
        );

        const courseStats = await pool.query(
            `SELECT
                COUNT(*) AS total_courses,
                COUNT(*) FILTER (WHERE status = 'PUBLISHED') AS published_courses,
                COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft_courses
             FROM courses
             WHERE institution_id = $1`,
            [institutionId]
        );

        const learningStats = await pool.query(
            `SELECT
                (SELECT COUNT(*)
                 FROM enrollments e
                 JOIN courses c
                    ON e.course_id = c.id
                 WHERE c.institution_id = $1) AS total_enrollments,

                (SELECT COUNT(*)
                 FROM enrollments e
                 JOIN courses c
                    ON e.course_id = c.id
                 WHERE c.institution_id = $1
                 AND e.status = 'ACTIVE') AS active_enrollments,

                (SELECT COUNT(*)
                 FROM modules m
                 JOIN courses c
                    ON m.course_id = c.id
                 WHERE c.institution_id = $1) AS total_modules,

                (SELECT COUNT(*)
                 FROM lessons l
                 JOIN modules m
                    ON l.module_id = m.id
                 JOIN courses c
                    ON m.course_id = c.id
                 WHERE c.institution_id = $1) AS total_lessons`,
            [institutionId]
        );

        const recentUsers = await pool.query(
            `SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                r.name AS role,
                u.created_at
             FROM users u
             JOIN roles r
                ON u.role_id = r.id
             WHERE u.institution_id = $1
             ORDER BY u.created_at DESC
             LIMIT 5`,
            [institutionId]
        );

        const recentCourses = await pool.query(
            `SELECT
                id,
                title,
                status,
                created_at
             FROM courses
             WHERE institution_id = $1
             ORDER BY created_at DESC
             LIMIT 5`,
            [institutionId]
        );

        const recentEnrollments = await pool.query(
            `SELECT
                e.id,
                e.student_id,
                u.first_name,
                u.last_name,
                c.id AS course_id,
                c.title AS course_title,
                e.status,
                e.enrolled_at
             FROM enrollments e
             JOIN users u
                ON e.student_id = u.id
             JOIN courses c
                ON e.course_id = c.id
             WHERE c.institution_id = $1
             ORDER BY e.enrolled_at DESC
             LIMIT 5`,
            [institutionId]
        );

        res.json({
            success: true,
            institution: institution.rows[0],
            statistics: {
                users: {
                    total_users: Number(userStats.rows[0].total_users),
                    total_students: Number(userStats.rows[0].total_students),
                    total_instructors: Number(userStats.rows[0].total_instructors),
                    total_admins: Number(userStats.rows[0].total_admins),
                    active_users: Number(userStats.rows[0].active_users)
                },
                courses: {
                    total_courses: Number(courseStats.rows[0].total_courses),
                    published_courses: Number(courseStats.rows[0].published_courses),
                    draft_courses: Number(courseStats.rows[0].draft_courses)
                },
                learning: {
                    total_enrollments: Number(learningStats.rows[0].total_enrollments),
                    active_enrollments: Number(learningStats.rows[0].active_enrollments),
                    total_modules: Number(learningStats.rows[0].total_modules),
                    total_lessons: Number(learningStats.rows[0].total_lessons)
                }
            },
            recent_users: recentUsers.rows,
            recent_courses: recentCourses.rows,
            recent_enrollments: recentEnrollments.rows
        });

    } catch (error) {
        console.error("Admin dashboard error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while loading admin dashboard"
        });
    }
};

const getAdminInstructors = async (req, res) => {
    try {
        const institutionId = req.user.institution_id;

        const result = await pool.query(
            `SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.is_active,
                u.created_at,
                COUNT(DISTINCT ci.course_id) AS total_courses,
                COUNT(DISTINCT e.student_id) AS total_students
             FROM users u
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN course_instructors ci
                ON u.id = ci.instructor_id
             LEFT JOIN courses c
                ON ci.course_id = c.id
                AND c.institution_id = u.institution_id
             LEFT JOIN enrollments e
                ON c.id = e.course_id
             WHERE u.institution_id = $1
             AND r.name = 'INSTRUCTOR'
             GROUP BY
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.is_active,
                u.created_at
             ORDER BY u.created_at DESC`,
            [institutionId]
        );

        return res.json({
            success: true,
            count: result.rows.length,
            instructors: result.rows
        });
    } catch (error) {
        console.error("Get admin instructors error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching instructors"
        });
    }
};
const getAdminEnrollments = async (req, res) => {
    try {
        const institutionId = req.user.institution_id;

        const result = await pool.query(
            `SELECT
                e.id,
                e.student_id,
                e.course_id,
                e.status,
                e.enrolled_at,
                e.completed_at,
                u.first_name,
                u.last_name,
                u.email,
                c.title AS course_title,
                c.slug AS course_slug
             FROM enrollments e
             JOIN users u
                ON e.student_id = u.id
             JOIN courses c
                ON e.course_id = c.id
             WHERE u.institution_id = $1
             AND c.institution_id = $1
             ORDER BY e.enrolled_at DESC`,
            [institutionId]
        );

        return res.json({
            success: true,
            count: result.rows.length,
            enrollments: result.rows
        });
    } catch (error) {
        console.error("Get admin enrollments error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching enrollments"
        });
    }
};
const getAuditLogs = async (req, res) => {
    try {
        const institutionId = req.user.institution_id;
        const { limit = 100, offset = 0 } = req.query;

        const result = await pool.query(
            `SELECT
                al.id,
                al.user_id,
                al.user_role,
                al.action,
                al.resource_type,
                al.resource_id,
                al.details,
                al.ip_address,
                al.created_at,
                u.first_name,
                u.last_name,
                u.email
             FROM audit_logs al
             LEFT JOIN users u
                ON al.user_id = u.id
             WHERE al.institution_id = $1
             ORDER BY al.created_at DESC
             LIMIT $2 OFFSET $3`,
            [institutionId, Number(limit), Number(offset)]
        );

        const countResult = await pool.query(
            `SELECT COUNT(*) AS total
             FROM audit_logs
             WHERE institution_id = $1`,
            [institutionId]
        );

        return res.json({
            success: true,
            count: result.rows.length,
            total: Number(countResult.rows[0].total),
            audit_logs: result.rows
        });
    } catch (error) {
        console.error("Get audit logs error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching audit logs"
        });
    }
};

module.exports = {
    getAdminDashboard,
    getAdminInstructors,
    getAdminEnrollments,
    getAuditLogs
};