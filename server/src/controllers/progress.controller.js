
const pool = require("../config/db");

const startLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const studentId = req.user.id;

        const lesson = await pool.query(
            `SELECT
                l.id,
                l.module_id,
                m.course_id,
                l.title,
                l.is_published
             FROM lessons l
             JOIN modules m
                ON l.module_id = m.id
             JOIN courses c
                ON m.course_id = c.id
             WHERE l.id = $1
             AND c.institution_id = $2
             AND l.is_published = TRUE`,
            [lessonId, req.user.institution_id]
        );

        if (lesson.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Published lesson not found"
            });
        }

        const enrollment = await pool.query(
            `SELECT id
             FROM enrollments
             WHERE student_id = $1
             AND course_id = $2
             AND status = 'ACTIVE'`,
            [studentId, lesson.rows[0].course_id]
        );

        if (enrollment.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this course"
            });
        }

        const result = await pool.query(
            `INSERT INTO lesson_progress
             (student_id, lesson_id, last_accessed_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (student_id, lesson_id)
             DO UPDATE SET
                last_accessed_at = CURRENT_TIMESTAMP
             RETURNING
                id,
                student_id,
                lesson_id,
                completed,
                completed_at,
                last_accessed_at`,
            [studentId, lessonId]
        );

        res.status(200).json({
            success: true,
            message: "Lesson access recorded",
            progress: result.rows[0]
        });

    } catch (error) {
        console.error("Start lesson error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while starting lesson"
        });
    }
};

const completeLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const studentId = req.user.id;

        const result = await pool.query(
            `UPDATE lesson_progress lp
             SET
                completed = TRUE,
                completed_at = CURRENT_TIMESTAMP,
                last_accessed_at = CURRENT_TIMESTAMP
             FROM lessons l
             JOIN modules m
                ON l.module_id = m.id
             JOIN courses c
                ON m.course_id = c.id
             WHERE lp.student_id = $1
             AND lp.lesson_id = $2
             AND lp.lesson_id = l.id
             AND c.institution_id = $3
             RETURNING
                lp.id,
                lp.student_id,
                lp.lesson_id,
                lp.completed,
                lp.completed_at,
                lp.last_accessed_at`,
            [studentId, lessonId, req.user.institution_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lesson progress not found"
            });
        }

        res.json({
            success: true,
            message: "Lesson completed successfully",
            progress: result.rows[0]
        });

    } catch (error) {
        console.error("Complete lesson error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while completing lesson"
        });
    }
};

const getLessonProgress = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const studentId = req.user.id;

        const result = await pool.query(
            `SELECT
                lp.id,
                lp.student_id,
                lp.lesson_id,
                lp.completed,
                lp.completed_at,
                lp.last_accessed_at
             FROM lesson_progress lp
             JOIN lessons l
                ON lp.lesson_id = l.id
             JOIN modules m
                ON l.module_id = m.id
             JOIN courses c
                ON m.course_id = c.id
             WHERE lp.student_id = $1
             AND lp.lesson_id = $2
             AND c.institution_id = $3`,
            [studentId, lessonId, req.user.institution_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lesson progress not found"
            });
        }

        res.json({
            success: true,
            progress: result.rows[0]
        });

    } catch (error) {
        console.error("Get lesson progress error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching lesson progress"
        });
    }
};

const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const enrollment = await pool.query(
            `SELECT id
             FROM enrollments
             WHERE student_id = $1
             AND course_id = $2
             AND status = 'ACTIVE'`,
            [studentId, courseId]
        );

        if (enrollment.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this course"
            });
        }

        const course = await pool.query(
            `SELECT id, title
             FROM courses
             WHERE id = $1
             AND institution_id = $2`,
            [courseId, req.user.institution_id]
        );

        if (course.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const modules = await pool.query(
            `SELECT
                m.id AS module_id,
                m.title AS module_title,
                m.position AS module_position,
                COUNT(l.id) AS total_lessons,
                COUNT(
                    CASE
                        WHEN lp.completed = TRUE THEN 1
                    END
                ) AS completed_lessons
             FROM modules m
             LEFT JOIN lessons l
                ON l.module_id = m.id
                AND l.is_published = TRUE
             LEFT JOIN lesson_progress lp
                ON lp.lesson_id = l.id
                AND lp.student_id = $2
             WHERE m.course_id = $1
             GROUP BY m.id, m.title, m.position
             ORDER BY m.position`,
            [courseId, studentId]
        );

        const lessons = await pool.query(
            `SELECT
                l.id AS lesson_id,
                l.module_id,
                l.title AS lesson_title,
                l.position,
                COALESCE(lp.completed, FALSE) AS completed,
                lp.completed_at
             FROM lessons l
             JOIN modules m
                ON l.module_id = m.id
             LEFT JOIN lesson_progress lp
                ON lp.lesson_id = l.id
                AND lp.student_id = $2
             WHERE m.course_id = $1
             AND l.is_published = TRUE
             ORDER BY m.position, l.position`,
            [courseId, studentId]
        );

        const totalLessons = lessons.rows.length;

        const completedLessons = lessons.rows.filter(
            lesson => lesson.completed
        ).length;

        const coursePercentage = totalLessons === 0
            ? 0
            : Math.round((completedLessons / totalLessons) * 100);

        const moduleProgress = modules.rows.map(module => {
            const total = Number(module.total_lessons);
            const completed = Number(module.completed_lessons);

            return {
                module_id: module.module_id,
                module_title: module.module_title,
                position: module.module_position,
                total_lessons: total,
                completed_lessons: completed,
                progress_percentage: total === 0
                    ? 0
                    : Math.round((completed / total) * 100)
            };
        });

        res.json({
            success: true,
            course: {
                id: course.rows[0].id,
                title: course.rows[0].title
            },
            progress: {
                total_modules: modules.rows.length,
                total_lessons: totalLessons,
                completed_lessons: completedLessons,
                progress_percentage: coursePercentage
            },
            modules: moduleProgress,
            lessons: lessons.rows
        });

    } catch (error) {
        console.error("Get course progress error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching course progress"
        });
    }
};

module.exports = {
    startLesson,
    completeLesson,
    getLessonProgress,
    getCourseProgress
};

