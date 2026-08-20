const pool = require("../config/db");

const getAdminCourses = async (req, res) => {
    try {
        const institutionId = req.user.institution_id;

        const result = await pool.query(
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
                c.updated_at,
                COUNT(DISTINCT ci.instructor_id) AS instructor_count,
                COUNT(DISTINCT e.student_id) AS student_count,
                COUNT(DISTINCT m.id) AS module_count
             FROM courses c
             LEFT JOIN course_instructors ci
                ON c.id = ci.course_id
             LEFT JOIN enrollments e
                ON c.id = e.course_id
             LEFT JOIN modules m
                ON c.id = m.course_id
             WHERE c.institution_id = $1
             GROUP BY
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
             ORDER BY c.created_at DESC`,
            [institutionId]
        );

        return res.json({
            success: true,
            count: result.rows.length,
            courses: result.rows
        });
    } catch (error) {
        console.error("Get admin courses error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching courses"
        });
    }
};

const getAdminCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;
        const institutionId = req.user.institution_id;

        const result = await pool.query(
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

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const course = result.rows[0];

        const instructorsResult = await pool.query(
            `SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                ci.assigned_at
             FROM course_instructors ci
             JOIN users u
                ON ci.instructor_id = u.id
             WHERE ci.course_id = $1
             ORDER BY ci.assigned_at DESC`,
            [courseId]
        );

        const modulesResult = await pool.query(
            `SELECT
                m.id,
                m.title,
                m.description,
                m.position,
                m.created_at,
                m.updated_at,
                COUNT(l.id) AS lesson_count
             FROM modules m
             LEFT JOIN lessons l
                ON m.id = l.module_id
             WHERE m.course_id = $1
             GROUP BY
                m.id,
                m.title,
                m.description,
                m.position,
                m.created_at,
                m.updated_at
             ORDER BY m.position ASC`,
            [courseId]
        );

        return res.json({
            success: true,
            course: {
                ...course,
                instructors: instructorsResult.rows,
                modules: modulesResult.rows
            }
        });
    } catch (error) {
        console.error("Get admin course error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching course"
        });
    }
};

const createAdminCourse = async (req, res) => {
    try {
        const {
            title,
            slug,
            description,
            thumbnail_url,
            level,
            status
        } = req.body;

        const institutionId = req.user.institution_id;

        if (!title || !slug) {
            return res.status(400).json({
                success: false,
                message: "Title and slug are required"
            });
        }

        const normalizedTitle = title.trim();
        const normalizedSlug = slug.trim().toLowerCase();

        if (!normalizedTitle || !normalizedSlug) {
            return res.status(400).json({
                success: false,
                message: "Title and slug cannot be empty"
            });
        }

        const existingCourse = await pool.query(
            `SELECT id
             FROM courses
             WHERE institution_id = $1
             AND LOWER(slug) = LOWER($2)`,
            [institutionId, normalizedSlug]
        );

        if (existingCourse.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A course with this slug already exists"
            });
        }

        const allowedStatuses = [
            "DRAFT",
            "PUBLISHED",
            "ARCHIVED"
        ];

        const courseStatus = status
            ? status.trim().toUpperCase()
            : "DRAFT";

        if (!allowedStatuses.includes(courseStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course status"
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
                normalizedTitle,
                normalizedSlug,
                description?.trim() || null,
                thumbnail_url?.trim() || null,
                level?.trim() || null,
                courseStatus
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Course created successfully",
            course: result.rows[0]
        });
    } catch (error) {
        console.error("Create admin course error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating course"
        });
    }
};

const updateAdminCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const {
            title,
            slug,
            description,
            thumbnail_url,
            level,
            status
        } = req.body;

        const institutionId = req.user.institution_id;

        const existingCourse = await pool.query(
            `SELECT id
             FROM courses
             WHERE id = $1
             AND institution_id = $2`,
            [courseId, institutionId]
        );

        if (existingCourse.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (
            title === undefined &&
            slug === undefined &&
            description === undefined &&
            thumbnail_url === undefined &&
            level === undefined &&
            status === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update"
            });
        }

        let normalizedSlug;

        if (slug !== undefined) {
            normalizedSlug = slug.trim().toLowerCase();

            if (!normalizedSlug) {
                return res.status(400).json({
                    success: false,
                    message: "Slug cannot be empty"
                });
            }

            const slugResult = await pool.query(
                `SELECT id
                 FROM courses
                 WHERE institution_id = $1
                 AND LOWER(slug) = LOWER($2)
                 AND id <> $3`,
                [institutionId, normalizedSlug, courseId]
            );

            if (slugResult.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "A course with this slug already exists"
                });
            }
        }

        if (status !== undefined) {
            const allowedStatuses = [
                "DRAFT",
                "PUBLISHED",
                "ARCHIVED"
            ];

            const normalizedStatus = status.trim().toUpperCase();

            if (!allowedStatuses.includes(normalizedStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid course status"
                });
            }
        }

        const fields = [];
        const values = [];
        let index = 1;

        if (title !== undefined) {
            const normalizedTitle = title.trim();

            if (!normalizedTitle) {
                return res.status(400).json({
                    success: false,
                    message: "Title cannot be empty"
                });
            }

            fields.push(`title = $${index++}`);
            values.push(normalizedTitle);
        }

        if (slug !== undefined) {
            fields.push(`slug = $${index++}`);
            values.push(normalizedSlug);
        }

        if (description !== undefined) {
            fields.push(`description = $${index++}`);
            values.push(description?.trim() || null);
        }

        if (thumbnail_url !== undefined) {
            fields.push(`thumbnail_url = $${index++}`);
            values.push(thumbnail_url?.trim() || null);
        }

        if (level !== undefined) {
            fields.push(`level = $${index++}`);
            values.push(level?.trim() || null);
        }

        if (status !== undefined) {
            fields.push(`status = $${index++}`);
            values.push(status.trim().toUpperCase());
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");

        values.push(courseId);
        const courseIdIndex = index++;

        values.push(institutionId);
        const institutionIdIndex = index++;

        const result = await pool.query(
            `UPDATE courses
             SET ${fields.join(", ")}
             WHERE id = $${courseIdIndex}
             AND institution_id = $${institutionIdIndex}
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
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        return res.json({
            success: true,
            message: "Course updated successfully",
            course: result.rows[0]
        });
    } catch (error) {
        console.error("Update admin course error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating course"
        });
    }
};

const deleteAdminCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const institutionId = req.user.institution_id;

        const result = await pool.query(
            `DELETE FROM courses
             WHERE id = $1
             AND institution_id = $2
             RETURNING id, title, slug`,
            [courseId, institutionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        return res.json({
            success: true,
            message: "Course deleted successfully",
            course: result.rows[0]
        });
    } catch (error) {
        console.error("Delete admin course error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting course"
        });
    }
};

module.exports = {
    getAdminCourses,
    getAdminCourseById,
    createAdminCourse,
    updateAdminCourse,
    deleteAdminCourse
};