
const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| GET INSTRUCTOR DASHBOARD
|--------------------------------------------------------------------------
*/
const getInstructorDashboard = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const institutionId = req.user.institution_id;

        const instructor = await pool.query(
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
             AND r.name = 'INSTRUCTOR'
             AND u.is_active = TRUE`,
            [instructorId, institutionId]
        );

        if (instructor.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            });
        }

        const courses = await pool.query(
            `SELECT
                c.id AS course_id,
                c.title AS course_title,
                c.slug,
                c.description,
                c.thumbnail_url,
                c.level,
                c.status,
                c.created_at,

                COUNT(DISTINCT e.student_id) AS total_students,
                COUNT(DISTINCT m.id) AS total_modules,
                COUNT(DISTINCT l.id) AS total_lessons,

                COUNT(
                    DISTINCT CASE
                        WHEN l.is_published = TRUE
                        THEN l.id
                    END
                ) AS published_lessons

             FROM course_instructors ci

             JOIN courses c
                ON ci.course_id = c.id

             LEFT JOIN enrollments e
                ON e.course_id = c.id
                AND e.status = 'ACTIVE'

             LEFT JOIN modules m
                ON m.course_id = c.id

             LEFT JOIN lessons l
                ON l.module_id = m.id

             WHERE ci.instructor_id = $1
             AND c.institution_id = $2

             GROUP BY
                c.id,
                c.title,
                c.slug,
                c.description,
                c.thumbnail_url,
                c.level,
                c.status,
                c.created_at

             ORDER BY c.created_at DESC`,
            [instructorId, institutionId]
        );

        const courseData = courses.rows.map((course) => ({
            course_id: course.course_id,
            course_title: course.course_title,
            slug: course.slug,
            description: course.description,
            thumbnail_url: course.thumbnail_url,
            level: course.level,
            status: course.status,
            created_at: course.created_at,

            total_students: Number(course.total_students),
            total_modules: Number(course.total_modules),
            total_lessons: Number(course.total_lessons),
            published_lessons: Number(course.published_lessons)
        }));

        const totalCourses = courseData.length;

        const publishedCourses = courseData.filter(
            (course) => course.status === "PUBLISHED"
        ).length;

        const totalStudents = courseData.reduce(
            (total, course) => total + course.total_students,
            0
        );

        const totalModules = courseData.reduce(
            (total, course) => total + course.total_modules,
            0
        );

        const totalLessons = courseData.reduce(
            (total, course) => total + course.total_lessons,
            0
        );

        return res.json({
            success: true,
            instructor: instructor.rows[0],

            statistics: {
                total_courses: totalCourses,
                published_courses: publishedCourses,
                total_students: totalStudents,
                total_modules: totalModules,
                total_lessons: totalLessons
            },

            courses: courseData
        });

    } catch (error) {
        console.error("Instructor dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while loading instructor dashboard"
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET INSTRUCTOR COURSES
|--------------------------------------------------------------------------
| Returns only courses assigned to the authenticated instructor.
|--------------------------------------------------------------------------
*/
const getInstructorCourses = async (req, res) => {
    try {
        const instructorId = req.user.id;
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
                c.updated_at,

                COUNT(DISTINCT e.student_id) AS student_count,
                COUNT(DISTINCT m.id) AS module_count,
                COUNT(DISTINCT l.id) AS lesson_count,

                COUNT(
                    DISTINCT CASE
                        WHEN l.is_published = TRUE
                        THEN l.id
                    END
                ) AS published_lesson_count

             FROM course_instructors ci

             JOIN courses c
                ON ci.course_id = c.id

             LEFT JOIN enrollments e
                ON c.id = e.course_id
                AND e.status = 'ACTIVE'

             LEFT JOIN modules m
                ON c.id = m.course_id

             LEFT JOIN lessons l
                ON m.id = l.module_id

             WHERE ci.instructor_id = $1
             AND c.institution_id = $2

             GROUP BY
                c.id,
                c.title,
                c.slug,
                c.description,
                c.thumbnail_url,
                c.level,
                c.status,
                c.created_at,
                c.updated_at

             ORDER BY c.created_at DESC`,
            [instructorId, institutionId]
        );

        return res.json({
            success: true,
            count: result.rows.length,
            courses: result.rows
        });

    } catch (error) {
        console.error("Get instructor courses error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching instructor courses"
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET INSTRUCTOR COURSE BY ID
|--------------------------------------------------------------------------
| Returns a specific course only when it is assigned to the
| authenticated instructor.
|--------------------------------------------------------------------------
*/
const getInstructorCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;
        const instructorId = req.user.id;
        const institutionId = req.user.institution_id;

        /*
        |------------------------------------------------------------------
        | Verify instructor owns/teaches this course
        |------------------------------------------------------------------
        */
        const courseResult = await pool.query(
            `SELECT
                c.id,
                c.institution_id,
                c.title,
                c.slug,
                c.description,
                c.thumbnail_url,
                c.level,
                c.status,
                c.created_at,
                c.updated_at
             FROM courses c

             INNER JOIN course_instructors ci
                ON c.id = ci.course_id

             WHERE c.id = $1
             AND ci.instructor_id = $2
             AND c.institution_id = $3`,
            [courseId, instructorId, institutionId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found or not assigned to you"
            });
        }

        const course = courseResult.rows[0];

        /*
        |------------------------------------------------------------------
        | Get modules
        |------------------------------------------------------------------
        */
        const modulesResult = await pool.query(
            `SELECT
                id,
                title,
                description,
                position
             FROM modules
             WHERE course_id = $1
             ORDER BY position`,
            [courseId]
        );

        /*
        |------------------------------------------------------------------
        | Get lessons
        |------------------------------------------------------------------
        */
        const lessonsResult = await pool.query(
            `SELECT
                l.id,
                l.module_id,
                l.title,
                l.content,
                l.video_url,
                l.position,
                l.duration_minutes,
                l.is_published
             FROM lessons l

             INNER JOIN modules m
                ON l.module_id = m.id

             WHERE m.course_id = $1

             ORDER BY m.position, l.position`,
            [courseId]
        );

        /*
        |------------------------------------------------------------------
        | Attach lessons to their modules
        |------------------------------------------------------------------
        */
        const modules = modulesResult.rows.map((module) => ({
            ...module,

            lessons: lessonsResult.rows.filter(
                (lesson) => lesson.module_id === module.id
            )
        }));

        /*
        |------------------------------------------------------------------
        | Course statistics
        |------------------------------------------------------------------
        */
        const statisticsResult = await pool.query(
            `SELECT

                (
                    SELECT COUNT(*)
                    FROM enrollments
                    WHERE course_id = $1
                    AND status = 'ACTIVE'
                ) AS total_students,

                (
                    SELECT COUNT(*)
                    FROM modules
                    WHERE course_id = $1
                ) AS total_modules,

                (
                    SELECT COUNT(*)
                    FROM lessons l
                    INNER JOIN modules m
                        ON l.module_id = m.id
                    WHERE m.course_id = $1
                ) AS total_lessons,

                (
                    SELECT COUNT(*)
                    FROM lessons l
                    INNER JOIN modules m
                        ON l.module_id = m.id
                    WHERE m.course_id = $1
                    AND l.is_published = TRUE
                ) AS published_lessons`,
            [courseId]
        );

        const statistics = statisticsResult.rows[0];

        /*
        |------------------------------------------------------------------
        | Final response
        |------------------------------------------------------------------
        */
        return res.json({
            success: true,

            course: {
                ...course,

                statistics: {
                    total_students: Number(statistics.total_students),
                    total_modules: Number(statistics.total_modules),
                    total_lessons: Number(statistics.total_lessons),
                    published_lessons: Number(
                        statistics.published_lessons
                    )
                },

                modules
            }
        });

    } catch (error) {
        console.error(
            "Instructor course details error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error while fetching instructor course"
        });
    }
};


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/
module.exports = {
    getInstructorDashboard,
    getInstructorCourses,
    getInstructorCourseById
};

