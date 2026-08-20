const pool = require("../config/db");

const publishCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const institutionId = req.user.institution_id;

        const result = await pool.query(
            `UPDATE courses
             SET status = 'PUBLISHED',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             AND institution_id = $2
             RETURNING id, institution_id, title, slug, description, thumbnail_url, level, status, created_at, updated_at`,
            [courseId, institutionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.json({
            success: true,
            message: "Course published successfully",
            course: result.rows[0]
        });
    } catch (error) {
        console.error("Publish course error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while publishing course"
        });
    }
};

module.exports = {
    publishCourse
};