
const pool = require("../config/db");


/*
|--------------------------------------------------------------------------
| CREATE COURSE
|--------------------------------------------------------------------------
*/
const createCourse = async (req, res) => {
    try {
        const {
            title,
            slug,
            description,
            thumbnail_url,
            level,
            status
        } = req.body;

        if (!title || !slug) {
            return res.status(400).json({
                success: false,
                message: "Title and slug are required"
            });
        }

        const institutionId = req.user.institution_id;

        // Verify institution
        const institution = await pool.query(
            `SELECT id
             FROM institutions
             WHERE id = $1
             AND is_active = TRUE`,
            [institutionId]
        );

        if (institution.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Institution not found"
            });
        }

        // Prevent duplicate slugs
        const existingCourse = await pool.query(
            `SELECT id
             FROM courses
             WHERE institution_id = $1
             AND slug = $2`,
            [institutionId, slug]
        );

        if (existingCourse.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A course with this slug already exists"
            });
        }

        const result = await pool.query(
            `INSERT INTO courses (
                institution_id,
                title,
                slug,
                description,
                thumbnail_url,
                level,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                id,
                institution_id,
                title,
                slug,
                description,
                thumbnail_url,
                level,
                status,
                created_at,
                updated_at`,
            [
                institutionId,
                title,
                slug,
                description || null,
                thumbnail_url || null,
                level || null,
                status || "DRAFT"
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Course created successfully",
            course: result.rows[0]
        });

    } catch (error) {
        console.error("Create course error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating course"
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET ALL COURSES
|--------------------------------------------------------------------------
*/
const getCourses = async (req, res) => {
    try {
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

                COUNT(DISTINCT ci.instructor_id) AS instructor_count,
                COUNT(DISTINCT e.student_id) AS student_count,
                COUNT(DISTINCT m.id) AS module_count,
                COUNT(DISTINCT l.id) AS lesson_count

             FROM courses c

             LEFT JOIN course_instructors ci
                ON c.id = ci.course_id

             LEFT JOIN enrollments e
                ON c.id = e.course_id

             LEFT JOIN modules m
                ON c.id = m.course_id

             LEFT JOIN lessons l
                ON m.id = l.module_id

             WHERE c.institution_id = $1

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
            [institutionId]
        );

        return res.json({
            success: true,
            count: result.rows.length,
            courses: result.rows
        });

    } catch (error) {
        console.error("Get courses error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching courses"
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET COURSE BY ID
|--------------------------------------------------------------------------
*/
const getCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;

        const userId = req.user.id;
        const institutionId = req.user.institution_id;
        const role = req.user.role;

        /*
        |--------------------------------------------------------------------------
        | Verify course belongs to institution
        |--------------------------------------------------------------------------
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
             WHERE c.id = $1
             AND c.institution_id = $2`,
            [courseId, institutionId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const course = courseResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | ROLE-BASED ACCESS CONTROL
        |--------------------------------------------------------------------------
        */

        // ADMIN
        if (role === "ADMIN") {
            // Admin can access all institution courses.
        }

        // INSTRUCTOR
        else if (role === "INSTRUCTOR") {
            const instructorAccess = await pool.query(
                `SELECT 1
                 FROM course_instructors
                 WHERE course_id = $1
                 AND instructor_id = $2`,
                [courseId, userId]
            );

            if (instructorAccess.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You are not assigned to this course"
                });
            }
        }

        // STUDENT
        else if (role === "STUDENT") {
            const enrollment = await pool.query(
                `SELECT 1
                 FROM enrollments
                 WHERE course_id = $1
                 AND student_id = $2
                 AND status = 'ACTIVE'`,
                [courseId, userId]
            );

            if (enrollment.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You are not enrolled in this course"
                });
            }
        }

        // Unknown role
        else {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this course"
            });
        }


        /*
        |--------------------------------------------------------------------------
        | GET INSTRUCTORS
        |--------------------------------------------------------------------------
        */
        const instructorsResult = await pool.query(
            `SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email
             FROM course_instructors ci
             JOIN users u
                ON ci.instructor_id = u.id
             WHERE ci.course_id = $1
             ORDER BY u.first_name, u.last_name`,
            [courseId]
        );


        /*
        |--------------------------------------------------------------------------
        | GET MODULES
        |--------------------------------------------------------------------------
        */
        const modulesResult = await pool.query(
            `SELECT
                m.id,
                m.title,
                m.description,
                m.position
             FROM modules m
             WHERE m.course_id = $1
             ORDER BY m.position`,
            [courseId]
        );


        /*
        |--------------------------------------------------------------------------
        | GET LESSONS
        |--------------------------------------------------------------------------
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
             JOIN modules m
                ON l.module_id = m.id
             WHERE m.course_id = $1
             ORDER BY m.position, l.position`,
            [courseId]
        );


        /*
        |--------------------------------------------------------------------------
        | GET COURSE STATISTICS
        |--------------------------------------------------------------------------
        */
        const statisticsResult = await pool.query(
            `SELECT
                (
                    SELECT COUNT(*)
                    FROM enrollments
                    WHERE course_id = $1
                ) AS total_students,

                (
                    SELECT COUNT(*)
                    FROM modules
                    WHERE course_id = $1
                ) AS total_modules,

                (
                    SELECT COUNT(*)
                    FROM lessons l
                    JOIN modules m
                        ON l.module_id = m.id
                    WHERE m.course_id = $1
                ) AS total_lessons,

                (
                    SELECT COUNT(*)
                    FROM lessons l
                    JOIN modules m
                        ON l.module_id = m.id
                    WHERE m.course_id = $1
                    AND l.is_published = TRUE
                ) AS published_lessons`,
            [courseId]
        );

        const statistics = statisticsResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | BUILD MODULE → LESSON STRUCTURE
        |--------------------------------------------------------------------------
        */
        const modules = modulesResult.rows.map((module) => ({
            ...module,

            lessons: lessonsResult.rows.filter(
                (lesson) => lesson.module_id === module.id
            )
        }));


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */
        return res.json({
            success: true,

            course: {
                ...course,

                instructors: instructorsResult.rows,

                statistics: {
                    total_students: Number(statistics.total_students),
                    total_modules: Number(statistics.total_modules),
                    total_lessons: Number(statistics.total_lessons),
                    published_lessons: Number(statistics.published_lessons)
                },

                modules
            }
        });

    } catch (error) {
        console.error("Get course by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching course"
        });
    }
};


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/
module.exports = {
    createCourse,
    getCourses,
    getCourseById
};

