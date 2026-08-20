
const pool = require("../config/db");

const getInstructorStudents = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const institutionId = req.user.institution_id;

        const result = await pool.query(
            `SELECT
                u.id AS student_id,
                u.first_name,
                u.last_name,
                u.email,
                c.id AS course_id,
                c.title AS course_title,
                e.enrolled_at,
                e.completed_at,
                e.status AS enrollment_status,
                COUNT(DISTINCT l.id) AS total_lessons,
                COUNT(
                    DISTINCT CASE
                        WHEN lp.completed = TRUE
                        THEN l.id
                    END
                ) AS completed_lessons,
                MAX(lp.last_accessed_at) AS last_accessed_at
             FROM course_instructors ci
             INNER JOIN courses c
                ON ci.course_id = c.id
             INNER JOIN enrollments e
                ON e.course_id = c.id
             INNER JOIN users u
                ON e.student_id = u.id
             INNER JOIN roles r
                ON u.role_id = r.id
             LEFT JOIN modules m
                ON m.course_id = c.id
             LEFT JOIN lessons l
                ON l.module_id = m.id
             LEFT JOIN lesson_progress lp
                ON lp.lesson_id = l.id
                AND lp.student_id = u.id
             WHERE ci.instructor_id = $1
             AND c.institution_id = $2
             AND u.institution_id = $2
             AND r.name = 'STUDENT'
             GROUP BY
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                c.id,
                c.title,
                e.enrolled_at,
                e.completed_at,
                e.status
             ORDER BY e.enrolled_at DESC`,
            [instructorId, institutionId]
        );

        const students = result.rows.map(student => {
            const totalLessons = Number(student.total_lessons);
            const completedLessons = Number(student.completed_lessons);

            const progressPercentage = totalLessons > 0
                ? Math.round((completedLessons / totalLessons) * 100)
                : 0;

            return {
                student_id: student.student_id,
                first_name: student.first_name,
                last_name: student.last_name,
                email: student.email,
                course_id: student.course_id,
                course_title: student.course_title,
                enrolled_at: student.enrolled_at,
                completed_at: student.completed_at,
                enrollment_status: student.enrollment_status,
                progress: {
                    total_lessons: totalLessons,
                    completed_lessons: completedLessons,
                    percentage: progressPercentage,
                    last_accessed_at: student.last_accessed_at
                }
            };
        });

        return res.json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error("Get instructor students error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching instructor students"
        });
    }
};

const getInstructorStudentDetails = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const institutionId = req.user.institution_id;
        const { studentId } = req.params;

        const studentResult = await pool.query(
            `SELECT DISTINCT
                u.id,
                u.first_name,
                u.last_name,
                u.email
             FROM course_instructors ci
             INNER JOIN courses c
                ON ci.course_id = c.id
             INNER JOIN enrollments e
                ON e.course_id = c.id
             INNER JOIN users u
                ON e.student_id = u.id
             INNER JOIN roles r
                ON u.role_id = r.id
             WHERE ci.instructor_id = $1
             AND c.institution_id = $2
             AND u.institution_id = $2
             AND u.id = $3
             AND r.name = 'STUDENT'`,
            [instructorId, institutionId, studentId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const coursesResult = await pool.query(
            `SELECT
                c.id AS course_id,
                c.title AS course_title,
                c.slug,
                c.status AS course_status,
                e.enrolled_at,
                e.completed_at,
                e.status AS enrollment_status,
                COUNT(DISTINCT l.id) AS total_lessons,
                COUNT(
                    DISTINCT CASE
                        WHEN lp.completed = TRUE
                        THEN l.id
                    END
                ) AS completed_lessons,
                MAX(lp.last_accessed_at) AS last_accessed_at
             FROM course_instructors ci
             INNER JOIN courses c
                ON ci.course_id = c.id
             INNER JOIN enrollments e
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
             AND e.student_id = $3
             GROUP BY
                c.id,
                c.title,
                c.slug,
                c.status,
                e.enrolled_at,
                e.completed_at,
                e.status
             ORDER BY e.enrolled_at DESC`,
            [instructorId, institutionId, studentId]
        );

        const courses = coursesResult.rows.map(course => {
            const totalLessons = Number(course.total_lessons);
            const completedLessons = Number(course.completed_lessons);

            return {
                course_id: course.course_id,
                course_title: course.course_title,
                slug: course.slug,
                course_status: course.course_status,
                enrolled_at: course.enrolled_at,
                completed_at: course.completed_at,
                enrollment_status: course.enrollment_status,
                progress: {
                    total_lessons: totalLessons,
                    completed_lessons: completedLessons,
                    percentage: totalLessons > 0
                        ? Math.round((completedLessons / totalLessons) * 100)
                        : 0,
                    last_accessed_at: course.last_accessed_at
                }
            };
        });

        const lessonsResult = await pool.query(
            `SELECT
                c.id AS course_id,
                c.title AS course_title,
                m.id AS module_id,
                m.title AS module_title,
                l.id AS lesson_id,
                l.title AS lesson_title,
                l.position,
                COALESCE(lp.completed, FALSE) AS completed,
                lp.completed_at,
                lp.last_accessed_at
             FROM course_instructors ci
             INNER JOIN courses c
                ON ci.course_id = c.id
             INNER JOIN modules m
                ON m.course_id = c.id
             INNER JOIN lessons l
                ON l.module_id = m.id
             LEFT JOIN lesson_progress lp
                ON lp.lesson_id = l.id
                AND lp.student_id = $3
             WHERE ci.instructor_id = $1
             AND c.institution_id = $2
             ORDER BY c.title, m.position, l.position`,
            [instructorId, institutionId, studentId]
        );

        const lessons = lessonsResult.rows.map(lesson => ({
            course_id: lesson.course_id,
            course_title: lesson.course_title,
            module_id: lesson.module_id,
            module_title: lesson.module_title,
            lesson_id: lesson.lesson_id,
            lesson_title: lesson.lesson_title,
            position: lesson.position,
            completed: lesson.completed,
            completed_at: lesson.completed_at,
            last_accessed_at: lesson.last_accessed_at
        }));

        return res.json({
            success: true,
            student: studentResult.rows[0],
            courses,
            lessons
        });

    } catch (error) {
        console.error("Get instructor student details error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching student details"
        });
    }
};

module.exports = {
    getInstructorStudents,
    getInstructorStudentDetails
};

