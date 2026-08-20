
const pool = require("../config/db");

const getInstructorAnalytics = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const institutionId = req.user.institution_id;

        const instructorResult = await pool.query(
            `SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email
             FROM users u
             INNER JOIN roles r
                ON u.role_id = r.id
             WHERE u.id = $1
             AND u.institution_id = $2
             AND r.name = 'INSTRUCTOR'
             AND u.is_active = TRUE`,
            [instructorId, institutionId]
        );

        if (instructorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            });
        }

        const overviewResult = await pool.query(
            `SELECT
                COUNT(DISTINCT c.id) AS total_courses,
                COUNT(DISTINCT CASE
                    WHEN c.status = 'PUBLISHED'
                    THEN c.id
                END) AS published_courses,
                COUNT(DISTINCT e.student_id) AS total_students,
                COUNT(DISTINCT CASE
                    WHEN e.status = 'ACTIVE'
                    THEN e.student_id
                END) AS active_students,
                COUNT(DISTINCT CASE
                    WHEN e.status = 'COMPLETED'
                    THEN e.student_id
                END) AS completed_enrollments,
                COUNT(DISTINCT m.id) AS total_modules,
                COUNT(DISTINCT l.id) AS total_lessons,
                COUNT(DISTINCT CASE
                    WHEN l.is_published = TRUE
                    THEN l.id
                END) AS published_lessons
             FROM course_instructors ci
             INNER JOIN courses c
                ON ci.course_id = c.id
             LEFT JOIN enrollments e
                ON e.course_id = c.id
             LEFT JOIN modules m
                ON m.course_id = c.id
             LEFT JOIN lessons l
                ON l.module_id = m.id
             WHERE ci.instructor_id = $1
             AND c.institution_id = $2`,
            [instructorId, institutionId]
        );

        const progressResult = await pool.query(
            `SELECT
                COUNT(DISTINCT e.student_id || '-' || c.id) AS total_enrollments,
                COUNT(
                    DISTINCT CASE
                        WHEN total_lessons.total > 0
                        AND completed_lessons.completed = total_lessons.total
                        THEN e.student_id || '-' || c.id
                    END
                ) AS completed_courses,
                COALESCE(
                    ROUND(
                        AVG(
                            CASE
                                WHEN total_lessons.total > 0
                                THEN (
                                    completed_lessons.completed::DECIMAL
                                    / total_lessons.total
                                ) * 100
                                ELSE 0
                            END
                        ),
                        2
                    ),
                    0
                ) AS average_progress
             FROM course_instructors ci
             INNER JOIN courses c
                ON ci.course_id = c.id
             INNER JOIN enrollments e
                ON e.course_id = c.id
             LEFT JOIN LATERAL (
                SELECT COUNT(*) AS total
                FROM modules m
                INNER JOIN lessons l
                    ON l.module_id = m.id
                WHERE m.course_id = c.id
             ) total_lessons
                ON TRUE
             LEFT JOIN LATERAL (
                SELECT COUNT(*) AS completed
                FROM modules m
                INNER JOIN lessons l
                    ON l.module_id = m.id
                INNER JOIN lesson_progress lp
                    ON lp.lesson_id = l.id
                    AND lp.student_id = e.student_id
                    AND lp.completed = TRUE
                WHERE m.course_id = c.id
             ) completed_lessons
                ON TRUE
             WHERE ci.instructor_id = $1
             AND c.institution_id = $2`,
            [instructorId, institutionId]
        );

        const courseResult = await pool.query(
            `SELECT
                c.id AS course_id,
                c.title AS course_title,
                c.status,
                COUNT(DISTINCT e.student_id) AS students,
                COUNT(DISTINCT l.id) AS total_lessons,
                COUNT(
                    DISTINCT CASE
                        WHEN l.is_published = TRUE
                        THEN l.id
                    END
                ) AS published_lessons,
                COUNT(
                    DISTINCT CASE
                        WHEN lp.completed = TRUE
                        THEN lp.lesson_id
                    END
                ) AS completed_lesson_records
             FROM course_instructors ci
             INNER JOIN courses c
                ON ci.course_id = c.id
             LEFT JOIN enrollments e
                ON e.course_id = c.id
             LEFT JOIN modules m
                ON m.course_id = c.id
             LEFT JOIN lessons l
                ON l.module_id = m.id
             LEFT JOIN lesson_progress lp
                ON lp.lesson_id = l.id
                AND lp.student_id = e.student_id
             WHERE ci.instructor_id = $1
             AND c.institution_id = $2
             GROUP BY
                c.id,
                c.title,
                c.status
             ORDER BY c.created_at DESC`,
            [instructorId, institutionId]
        );

        const overview = overviewResult.rows[0];
        const progress = progressResult.rows[0];

        const courses = courseResult.rows.map(course => ({
            course_id: course.course_id,
            course_title: course.course_title,
            status: course.status,
            students: Number(course.students),
            total_lessons: Number(course.total_lessons),
            published_lessons: Number(course.published_lessons),
            completed_lesson_records: Number(course.completed_lesson_records)
        }));

        return res.json({
            success: true,
            instructor: instructorResult.rows[0],
            overview: {
                total_courses: Number(overview.total_courses),
                published_courses: Number(overview.published_courses),
                total_students: Number(overview.total_students),
                active_students: Number(overview.active_students),
                completed_enrollments: Number(overview.completed_enrollments),
                total_modules: Number(overview.total_modules),
                total_lessons: Number(overview.total_lessons),
                published_lessons: Number(overview.published_lessons)
            },
            learning: {
                total_enrollments: Number(progress.total_enrollments),
                completed_courses: Number(progress.completed_courses),
                average_progress: Number(progress.average_progress)
            },
            courses
        });

    } catch (error) {
        console.error("Instructor analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while loading instructor analytics"
        });
    }
};

module.exports = {
    getInstructorAnalytics
};

