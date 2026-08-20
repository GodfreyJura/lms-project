
const pool = require("../config/db");

const createLesson = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const {
            title,
            content,
            video_url,
            position,
            duration_minutes
        } = req.body;

        if (!moduleId || !title || position === undefined) {
            return res.status(400).json({
                success: false,
                message: "Module ID, title and position are required"
            });
        }

        const module = await pool.query(
            `SELECT m.id, c.institution_id
             FROM modules m
             JOIN courses c ON m.course_id = c.id
             WHERE m.id = $1
             AND c.institution_id = $2`,
            [moduleId, req.user.institution_id]
        );

        if (module.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        const existingLesson = await pool.query(
            `SELECT id
             FROM lessons
             WHERE module_id = $1
             AND position = $2`,
            [moduleId, position]
        );

        if (existingLesson.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A lesson already exists at this position"
            });
        }

        const result = await pool.query(
            `INSERT INTO lessons
             (module_id, title, content, video_url, position, duration_minutes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, module_id, title, content, video_url,
                       position, duration_minutes, is_published,
                       created_at, updated_at`,
            [
                moduleId,
                title,
                content || null,
                video_url || null,
                position,
                duration_minutes || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Lesson created successfully",
            lesson: result.rows[0]
        });

    } catch (error) {
        console.error("Create lesson error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating lesson"
        });
    }
};

const publishLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const result = await pool.query(
            `UPDATE lessons l
             SET is_published = TRUE,
                 updated_at = CURRENT_TIMESTAMP
             FROM modules m
             JOIN courses c ON m.course_id = c.id
             WHERE l.id = $1
             AND l.module_id = m.id
             AND c.institution_id = $2
             RETURNING l.id, l.module_id, l.title, l.content,
                       l.video_url, l.position, l.duration_minutes,
                       l.is_published, l.created_at, l.updated_at`,
            [lessonId, req.user.institution_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        return res.json({
            success: true,
            message: "Lesson published successfully",
            lesson: result.rows[0]
        });

    } catch (error) {
        console.error("Publish lesson error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while publishing lesson"
        });
    }
};

const getPublishedLessons = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const studentId = req.user.id;

        const module = await pool.query(
            `SELECT m.id, m.course_id
             FROM modules m
             JOIN courses c ON m.course_id = c.id
             WHERE m.id = $1
             AND c.institution_id = $2`,
            [moduleId, req.user.institution_id]
        );

        if (module.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        const enrollment = await pool.query(
            `SELECT id
             FROM enrollments
             WHERE student_id = $1
             AND course_id = $2
             AND status = 'ACTIVE'`,
            [studentId, module.rows[0].course_id]
        );

        if (enrollment.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this course"
            });
        }

        const result = await pool.query(
            `SELECT
                id,
                module_id,
                title,
                content,
                video_url,
                position,
                duration_minutes,
                is_published,
                created_at,
                updated_at
             FROM lessons
             WHERE module_id = $1
             AND is_published = TRUE
             ORDER BY position ASC`,
            [moduleId]
        );

        return res.json({
            success: true,
            lessons: result.rows
        });

    } catch (error) {
        console.error("Get published lessons error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching lessons"
        });
    }
};

const getStudentLesson = async (req, res) => {
    try {
        const studentId = req.user.id;
        const institutionId = req.user.institution_id;
        const { lessonId } = req.params;

        const result = await pool.query(
            `SELECT
                l.id AS lesson_id,
                l.title AS lesson_title,
                l.content,
                l.video_url,
                l.position,
                l.duration_minutes,
                l.is_published,

                m.id AS module_id,
                m.title AS module_title,
                m.position AS module_position,

                c.id AS course_id,
                c.title AS course_title,
                c.slug AS course_slug,

                e.status AS enrollment_status,

                COALESCE(lp.completed, FALSE) AS completed,
                lp.completed_at,
                lp.last_accessed_at

             FROM lessons l

             JOIN modules m
                ON l.module_id = m.id

             JOIN courses c
                ON m.course_id = c.id

             JOIN enrollments e
                ON e.course_id = c.id
                AND e.student_id = $1
                AND e.status = 'ACTIVE'

             LEFT JOIN lesson_progress lp
                ON lp.lesson_id = l.id
                AND lp.student_id = $1

             WHERE l.id = $2
             AND l.is_published = TRUE
             AND c.institution_id = $3`,
            [studentId, lessonId, institutionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found or student is not enrolled"
            });
        }

        return res.json({
            success: true,
            lesson: result.rows[0]
        });

    } catch (error) {
        console.error("Get student lesson error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while loading lesson"
        });
    }
};

module.exports = {
    createLesson,
    publishLesson,
    getPublishedLessons,
    getStudentLesson
};

