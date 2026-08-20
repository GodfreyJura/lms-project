const pool = require("../config/db");

const assignInstructor = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { instructor_id } = req.body;

        if (!courseId || !instructor_id) {
            return res.status(400).json({
                success: false,
                message: "Course ID and instructor ID are required"
            });
        }

        const course = await pool.query(
            `SELECT id, institution_id
             FROM courses
             WHERE id = $1`,
            [courseId]
        );

        if (course.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const instructor = await pool.query(
            `SELECT u.id
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.id = $1
             AND u.institution_id = $2
             AND r.name = 'INSTRUCTOR'
             AND u.is_active = TRUE`,
            [instructor_id, course.rows[0].institution_id]
        );

        if (instructor.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found in this institution"
            });
        }

        const existingAssignment = await pool.query(
            `SELECT course_id, instructor_id
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
            `INSERT INTO course_instructors
             (course_id, instructor_id)
             VALUES ($1, $2)
             RETURNING course_id, instructor_id, assigned_at`,
            [courseId, instructor_id]
        );

        res.status(201).json({
            success: true,
            message: "Instructor assigned successfully",
            assignment: result.rows[0]
        });
    } catch (error) {
        console.error("Assign instructor error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while assigning instructor"
        });
    }
};

module.exports = {
    assignInstructor
};