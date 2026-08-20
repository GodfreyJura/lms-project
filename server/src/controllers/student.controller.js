
const pool = require("../config/db");

const getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;
        const institutionId = req.user.institution_id;

        const student = await pool.query(
            `SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                r.name AS role
             FROM users u
             JOIN roles r
                ON u.role_id = r.id
             WHERE u.id = $1
             AND u.institution_id = $2
             AND r.name = 'STUDENT'
             AND u.is_active = TRUE`,
            [studentId, institutionId]
        );

        if (student.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const courses = await pool.query(
            `SELECT
                c.id AS course_id,
                c.title AS course_title,
                c.description AS course_description,
                e.status AS enrollment_status,
                e.enrolled_at,
                COUNT(l.id) AS total_lessons,
                COUNT(
                    CASE
                        WHEN lp.completed = TRUE THEN 1
                    END
                ) AS completed_lessons,
                MAX(lp.last_accessed_at) AS last_accessed_at
             FROM enrollments e
             JOIN courses c
                ON e.course_id = c.id
             LEFT JOIN modules m
                ON m.course_id = c.id
             LEFT JOIN lessons l
                ON l.module_id = m.id
                AND l.is_published = TRUE
             LEFT JOIN lesson_progress lp
                ON lp.lesson_id = l.id
                AND lp.student_id = e.student_id
             WHERE e.student_id = $1
             AND c.institution_id = $2
             GROUP BY
                c.id,
                c.title,
                c.description,
                e.status,
                e.enrolled_at
             ORDER BY e.enrolled_at DESC`,
            [studentId, institutionId]
        );

        const courseData = courses.rows.map(course => {
            const totalLessons = Number(course.total_lessons);
            const completedLessons = Number(course.completed_lessons);

            return {
                course_id: course.course_id,
                course_title: course.course_title,
                course_description: course.course_description,
                enrollment_status: course.enrollment_status,
                enrolled_at: course.enrolled_at,
                total_lessons: totalLessons,
                completed_lessons: completedLessons,
                progress_percentage: totalLessons === 0
                    ? 0
                    : Math.round(
                        (completedLessons / totalLessons) * 100
                    ),
                last_accessed_at: course.last_accessed_at
            };
        });

        const totalCourses = courseData.length;

        const completedCourses = courseData.filter(
            course => course.progress_percentage === 100
        ).length;

        const totalLessons = courseData.reduce(
            (total, course) => total + course.total_lessons,
            0
        );

        const completedLessons = courseData.reduce(
            (total, course) => total + course.completed_lessons,
            0
        );

        const overallProgress = totalLessons === 0
            ? 0
            : Math.round(
                (completedLessons / totalLessons) * 100
            );

        return res.json({
            success: true,
            student: student.rows[0],
            statistics: {
                total_courses: totalCourses,
                completed_courses: completedCourses,
                total_lessons: totalLessons,
                completed_lessons: completedLessons,
                overall_progress_percentage: overallProgress
            },
            courses: courseData
        });

    } catch (error) {
        console.error("Student dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while loading student dashboard"
        });
    }
};

const getStudentCourseDetails = async (req, res) => {
    try {
        const studentId = req.user.id;
        const institutionId = req.user.institution_id;
        const { courseId } = req.params;

        const enrollment = await pool.query(
            `SELECT
                e.id AS enrollment_id,
                e.status AS enrollment_status,
                e.enrolled_at,
                c.id AS course_id,
                c.title,
                c.slug,
                c.description,
                c.thumbnail_url,
                c.level,
                c.status,
                c.created_at
             FROM enrollments e
             JOIN courses c
                ON e.course_id = c.id
             WHERE e.student_id = $1
             AND e.course_id = $2
             AND c.institution_id = $3`,
            [studentId, courseId, institutionId]
        );

        if (enrollment.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found or student is not enrolled"
            });
        }

        if (enrollment.rows[0].enrollment_status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Student enrollment is not active"
            });
        }

        const modules = await pool.query(
            `SELECT
                m.id,
                m.title,
                m.description,
                m.position
             FROM modules m
             WHERE m.course_id = $1
             ORDER BY m.position ASC`,
            [courseId]
        );

        const lessons = await pool.query(
            `SELECT
                l.id,
                l.module_id,
                l.title,
                l.content,
                l.video_url,
                l.position,
                l.duration_minutes,
                COALESCE(lp.completed, FALSE) AS completed,
                lp.completed_at,
                lp.last_accessed_at
             FROM lessons l
             LEFT JOIN lesson_progress lp
                ON lp.lesson_id = l.id
                AND lp.student_id = $1
             WHERE l.module_id IN (
                 SELECT id
                 FROM modules
                 WHERE course_id = $2
             )
             AND l.is_published = TRUE
             ORDER BY l.module_id, l.position ASC`,
            [studentId, courseId]
        );

        const moduleData = modules.rows.map(module => ({
            id: module.id,
            title: module.title,
            description: module.description,
            position: module.position,
            lessons: lessons.rows
                .filter(lesson => lesson.module_id === module.id)
                .map(lesson => ({
                    id: lesson.id,
                    title: lesson.title,
                    content: lesson.content,
                    video_url: lesson.video_url,
                    position: lesson.position,
                    duration_minutes: lesson.duration_minutes,
                    completed: lesson.completed,
                    completed_at: lesson.completed_at,
                    last_accessed_at: lesson.last_accessed_at
                }))
        }));

        const totalLessons = lessons.rows.length;

        const completedLessons = lessons.rows.filter(
            lesson => lesson.completed === true
        ).length;

        const progressPercentage = totalLessons === 0
            ? 0
            : Math.round(
                (completedLessons / totalLessons) * 100
            );

        return res.json({
            success: true,
            course: {
                ...enrollment.rows[0],
                total_modules: modules.rows.length,
                total_lessons: totalLessons,
                completed_lessons: completedLessons,
                progress_percentage: progressPercentage
            },
            modules: moduleData
        });

    } catch (error) {
        console.error("Student course details error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while loading course details"
        });
    }
};
const getPublishedCourses = async (req, res) => {
    try {
        const studentId = req.user.id;
        const institutionId = req.user.institution_id;

        const result = await pool.query(
            `SELECT
                c.id,
                c.title,
                c.slug,
                c.description,
                c.thumbnail_url,
                c.level,
                c.status,
                c.created_at,
                COUNT(DISTINCT m.id) AS module_count,
                COUNT(DISTINCT l.id) AS lesson_count,
                CASE 
                    WHEN e.id IS NOT NULL THEN TRUE
                    ELSE FALSE
                END AS is_enrolled
             FROM courses c
             LEFT JOIN modules m
                ON c.id = m.course_id
             LEFT JOIN lessons l
                ON m.id = l.module_id
             LEFT JOIN enrollments e
                ON c.id = e.course_id
                AND e.student_id = $1
             WHERE c.institution_id = $2
             AND c.status = 'PUBLISHED'
             GROUP BY
                c.id,
                c.title,
                c.slug,
                c.description,
                c.thumbnail_url,
                c.level,
                c.status,
                c.created_at,
                e.id
             ORDER BY c.created_at DESC`,
            [studentId, institutionId]
        );

        const courses = result.rows.map(course => ({
            ...course,
            module_count: Number(course.module_count),
            lesson_count: Number(course.lesson_count),
            is_enrolled: course.is_enrolled === true
        }));

        return res.json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        console.error("Get published courses error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching courses"
        });
    }
};
module.exports = {
    getStudentDashboard,
    getStudentCourseDetails,
    getPublishedCourses
};
