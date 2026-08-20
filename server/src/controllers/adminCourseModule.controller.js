const pool = require("../config/db");

/**
 * Verify that a course belongs to the authenticated admin's institution.
 */
const verifyCourse = async (courseId, institutionId) => {
    const result = await pool.query(
        `SELECT id, institution_id, title, status
         FROM courses
         WHERE id = $1
         AND institution_id = $2`,
        [courseId, institutionId]
    );

    return result.rows[0] || null;
};


/**
 * GET /api/admin/courses/:courseId/modules
 */
const getAdminCourseModules = async (req, res) => {
    try {
        const { courseId } = req.params;
        const institutionId = req.user.institution_id;

        const course = await verifyCourse(courseId, institutionId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const result = await pool.query(
            `SELECT
                m.id,
                m.course_id,
                m.title,
                m.description,
                m.position,
                m.created_at,
                m.updated_at,
                COUNT(l.id) AS lesson_count
             FROM modules m
             LEFT JOIN lessons l
                ON l.module_id = m.id
             WHERE m.course_id = $1
             GROUP BY
                m.id,
                m.course_id,
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
            count: result.rows.length,
            course: {
                id: course.id,
                title: course.title,
                status: course.status
            },
            modules: result.rows
        });

    } catch (error) {
        console.error("Get admin course modules error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching modules"
        });
    }
};


/**
 * GET /api/admin/courses/:courseId/modules/:moduleId
 */
const getAdminCourseModuleById = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const institutionId = req.user.institution_id;

        const course = await verifyCourse(courseId, institutionId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const moduleResult = await pool.query(
            `SELECT
                m.id,
                m.course_id,
                m.title,
                m.description,
                m.position,
                m.created_at,
                m.updated_at
             FROM modules m
             WHERE m.id = $1
             AND m.course_id = $2`,
            [moduleId, courseId]
        );

        if (moduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        const lessonsResult = await pool.query(
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
             ORDER BY position ASC`,
            [moduleId]
        );

        return res.json({
            success: true,
            module: {
                ...moduleResult.rows[0],
                lessons: lessonsResult.rows
            }
        });

    } catch (error) {
        console.error("Get admin module error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching module"
        });
    }
};


/**
 * POST /api/admin/courses/:courseId/modules
 */
const createAdminCourseModule = async (req, res) => {
    try {
        const { courseId } = req.params;
        const {
            title,
            description,
            position
        } = req.body;

        const institutionId = req.user.institution_id;

        if (!title || position === undefined) {
            return res.status(400).json({
                success: false,
                message: "Title and position are required"
            });
        }

        const normalizedTitle = title.trim();

        if (!normalizedTitle) {
            return res.status(400).json({
                success: false,
                message: "Title cannot be empty"
            });
        }

        const numericPosition = Number(position);

        if (
            !Number.isInteger(numericPosition) ||
            numericPosition < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Position must be a positive integer"
            });
        }

        const course = await verifyCourse(courseId, institutionId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const existingModule = await pool.query(
            `SELECT id
             FROM modules
             WHERE course_id = $1
             AND position = $2`,
            [courseId, numericPosition]
        );

        if (existingModule.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A module already exists at this position"
            });
        }

        const result = await pool.query(
            `INSERT INTO modules
             (
                course_id,
                title,
                description,
                position
             )
             VALUES ($1, $2, $3, $4)
             RETURNING
                id,
                course_id,
                title,
                description,
                position,
                created_at,
                updated_at`,
            [
                courseId,
                normalizedTitle,
                description?.trim() || null,
                numericPosition
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Module created successfully",
            module: result.rows[0]
        });

    } catch (error) {
        console.error("Create admin module error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating module"
        });
    }
};


/**
 * PUT /api/admin/courses/:courseId/modules/:moduleId
 */
const updateAdminCourseModule = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;

        const {
            title,
            description,
            position
        } = req.body;

        const institutionId = req.user.institution_id;

        const course = await verifyCourse(courseId, institutionId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const moduleResult = await pool.query(
            `SELECT id
             FROM modules
             WHERE id = $1
             AND course_id = $2`,
            [moduleId, courseId]
        );

        if (moduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        if (
            title === undefined &&
            description === undefined &&
            position === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update"
            });
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

        if (description !== undefined) {
            fields.push(`description = $${index++}`);
            values.push(description?.trim() || null);
        }

        if (position !== undefined) {
            const numericPosition = Number(position);

            if (
                !Number.isInteger(numericPosition) ||
                numericPosition < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Position must be a positive integer"
                });
            }

            const positionCheck = await pool.query(
                `SELECT id
                 FROM modules
                 WHERE course_id = $1
                 AND position = $2
                 AND id <> $3`,
                [courseId, numericPosition, moduleId]
            );

            if (positionCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "A module already exists at this position"
                });
            }

            fields.push(`position = $${index++}`);
            values.push(numericPosition);
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");

        values.push(moduleId);
        const moduleIdIndex = index++;

        const result = await pool.query(
            `UPDATE modules
             SET ${fields.join(", ")}
             WHERE id = $${moduleIdIndex}
             AND course_id = $${moduleIdIndex + 1}
             RETURNING
                id,
                course_id,
                title,
                description,
                position,
                created_at,
                updated_at`,
            [...values, courseId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        return res.json({
            success: true,
            message: "Module updated successfully",
            module: result.rows[0]
        });

    } catch (error) {
        console.error("Update admin module error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating module"
        });
    }
};


/**
 * DELETE /api/admin/courses/:courseId/modules/:moduleId
 */
const deleteAdminCourseModule = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const institutionId = req.user.institution_id;

        const course = await verifyCourse(courseId, institutionId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const result = await pool.query(
            `DELETE FROM modules
             WHERE id = $1
             AND course_id = $2
             RETURNING
                id,
                course_id,
                title,
                position`,
            [moduleId, courseId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        return res.json({
            success: true,
            message: "Module deleted successfully",
            module: result.rows[0]
        });

    } catch (error) {
        console.error("Delete admin module error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting module"
        });
    }
};


module.exports = {
    getAdminCourseModules,
    getAdminCourseModuleById,
    createAdminCourseModule,
    updateAdminCourseModule,
    deleteAdminCourseModule
};