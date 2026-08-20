const pool = require("../config/db");

const enrollInCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;
        const institutionId = req.user.institution_id;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required"
            });
        }

        if (!studentId || !institutionId) {
            return res.status(401).json({
                success: false,
                message: "Invalid student authentication"
            });
        }

        // Verify that the course exists and belongs to the student's institution
        const courseResult = await pool.query(
            `SELECT
                id,
                institution_id,
                status
             FROM courses
             WHERE id = $1
             AND institution_id = $2`,
            [courseId, institutionId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const course = courseResult.rows[0];

        // Only published courses can be enrolled in
        if (course.status !== "PUBLISHED") {
            return res.status(400).json({
                success: false,
                message: "Course is not available for enrollment"
            });
        }

        // Verify that the authenticated user is an active student
        const studentResult = await pool.query(
            `SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email
             FROM users u
             JOIN roles r
                ON u.role_id = r.id
             WHERE u.id = $1
             AND u.institution_id = $2
             AND r.name = 'STUDENT'
             AND u.is_active = TRUE`,
            [studentId, institutionId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Student is not eligible for this course"
            });
        }

        // Prevent duplicate enrollment
        const existingEnrollment = await pool.query(
            `SELECT
                id,
                status
             FROM enrollments
             WHERE student_id = $1
             AND course_id = $2`,
            [studentId, courseId]
        );

        if (existingEnrollment.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Student is already enrolled in this course"
            });
        }

        // Create enrollment
        const result = await pool.query(
            `INSERT INTO enrollments
                (
                    student_id,
                    course_id
                )
             VALUES
                ($1, $2)
             RETURNING
                id,
                student_id,
                course_id,
                enrolled_at,
                completed_at,
                status`,
            [studentId, courseId]
        );

        return res.status(201).json({
            success: true,
            message: "Student enrolled successfully",
            enrollment: result.rows[0]
        });

    } catch (error) {
        console.error("Enrollment error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while enrolling student"
        });
    }
};


const getMyEnrollments = async (req, res) => {
    try {
        const studentId = req.user.id;
        const institutionId = req.user.institution_id;

        if (!studentId || !institutionId) {
            return res.status(401).json({
                success: false,
                message: "Invalid student authentication"
            });
        }

        const result = await pool.query(
            `SELECT
                e.id,
                e.student_id,
                e.course_id,
                e.enrolled_at,
                e.completed_at,
                e.status,

                c.title AS course_title,
                c.slug AS course_slug,
                c.description AS course_description,
                c.thumbnail_url,
                c.level,
                c.status AS course_status

             FROM enrollments e

             JOIN courses c
                ON e.course_id = c.id

             WHERE e.student_id = $1
             AND c.institution_id = $2

             ORDER BY e.enrolled_at DESC`,
            [studentId, institutionId]
        );

        return res.json({
            success: true,
            count: result.rows.length,
            enrollments: result.rows
        });

    } catch (error) {
        console.error("Get my enrollments error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching enrollments"
        });
    }
};


module.exports = {
    enrollInCourse,
    getMyEnrollments
};