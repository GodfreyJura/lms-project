const pool = require("../config/db");

const getCourseInstructors = async (req, res) => {
    try {
        const { courseId } = req.params;
        const institutionId = req.user.institution_id;

        const courseResult = await pool.query(
            `SELECT id, title
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

        const result = await pool.query(
            `SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.is_active,
                ci.assigned_at
             FROM course_instructors ci
             JOIN users u
                ON ci.instructor_id = u.id
             JOIN roles r
                ON u.role_id = r.id
             WHERE ci.course_id = $1
             AND u.institution_id = $2
             AND r.name = 'INSTRUCTOR'
             ORDER BY ci.assigned_at DESC`,
            [courseId, institutionId]
        );

        return res.json({
            success: true,
            course: courseResult.rows[0],
            count: result.rows.length,
            instructors: result.rows
        });
    } catch (error) {
        console.error("Get course instructors error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching course instructors"
        });
    }
};

const assignCourseInstructor = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { instructor_id } = req.body;
        const institutionId = req.user.institution_id;

        if (!instructor_id) {
            return res.status(400).json({
                success: false,
                message: "Instructor ID is required"
            });
        }

        const courseResult = await pool.query(
            `SELECT id, title
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

        const instructorResult = await pool.query(
            `SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.is_active
             FROM users u
             JOIN roles r
                ON u.role_id = r.id
             WHERE u.id = $1
             AND u.institution_id = $2
             AND r.name = 'INSTRUCTOR'`,
            [instructor_id, institutionId]
        );

        if (instructorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            });
        }

        if (!instructorResult.rows[0].is_active) {
            return res.status(400).json({
                success: false,
                message: "Instructor account is inactive"
            });
        }

        const existingAssignment = await pool.query(
            `SELECT course_id
             FROM course_instructors
             WHERE course_id = $1
             AND instructor_id = $2`,
            [courseId, instructor_id]
        );

        if (existingAssignment.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Instructor is already assigned to this course"
            });
        }

        const result = await pool.query(
            `INSERT INTO course_instructors (
                course_id,
                instructor_id
             )
             VALUES ($1, $2)
             RETURNING
                course_id,
                instructor_id,
                assigned_at`,
            [courseId, instructor_id]
        );

        return res.status(201).json({
            success: true,
            message: "Instructor assigned successfully",
            assignment: {
                ...result.rows[0],
                course: courseResult.rows[0],
                instructor: instructorResult.rows[0]
            }
        });
    } catch (error) {
        console.error("Assign course instructor error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while assigning instructor"
        });
    }
};

const removeCourseInstructor = async (req, res) => {
    try {
        const { courseId, instructorId } = req.params;
        const institutionId = req.user.institution_id;

        const courseResult = await pool.query(
            `SELECT id, title
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

        const instructorResult = await pool.query(
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
             AND r.name = 'INSTRUCTOR'`,
            [instructorId, institutionId]
        );

        if (instructorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            });
        }

        const result = await pool.query(
            `DELETE FROM course_instructors
             WHERE course_id = $1
             AND instructor_id = $2
             RETURNING
                course_id,
                instructor_id,
                assigned_at`,
            [courseId, instructorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Instructor is not assigned to this course"
            });
        }

        return res.json({
            success: true,
            message: "Instructor removed successfully",
            assignment: {
                ...result.rows[0],
                course: courseResult.rows[0],
                instructor: instructorResult.rows[0]
            }
        });
    } catch (error) {
        console.error("Remove course instructor error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while removing instructor"
        });
    }
};

module.exports = {
    getCourseInstructors,
    assignCourseInstructor,
    removeCourseInstructor
};