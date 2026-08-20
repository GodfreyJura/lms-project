const pool = require("../config/db");

/**
 * Check whether the current user can manage the course.
 *
 * ADMIN:
 *   Can manage any course in their institution.
 *
 * INSTRUCTOR:
 *   Can manage only courses assigned to them.
 */
const verifyCourseAccess = async (courseId, user) => {
    const result = await pool.query(
        `SELECT
            c.id,
            c.institution_id,
            c.title,
            c.status
         FROM courses c
         WHERE c.id = $1
         AND c.institution_id = $2`,
        [courseId, user.institution_id]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const course = result.rows[0];

    // Admin has access to every course in their institution
    if (user.role === "ADMIN") {
        return course;
    }

    // Instructor must be assigned to the course
    if (user.role === "INSTRUCTOR") {
        const assignment = await pool.query(
            `SELECT course_id
             FROM course_instructors
             WHERE course_id = $1
             AND instructor_id = $2`,
            [courseId, user.id]
        );

        if (assignment.rows.length === 0) {
            return null;
        }

        return course;
    }

    return null;
};


/**
 * CREATE MODULE
 */
const createModule = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, position } = req.body;

        if (!courseId || !title || position === undefined) {
            return res.status(400).json({
                success: false,
                message: "Course ID, title and position are required"
            });
        }

        const course = await verifyCourseAccess(
            courseId,
            req.user
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found or access denied"
            });
        }

        const existingModule = await pool.query(
            `SELECT id
             FROM modules
             WHERE course_id = $1
             AND position = $2`,
            [courseId, position]
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
                title.trim(),
                description?.trim() || null,
                position
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Module created successfully",
            module: result.rows[0]
        });

    } catch (error) {
        console.error("Create module error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating module"
        });
    }
};


/**
 * GET ALL MODULES FOR A COURSE
 */
const getCourseModules = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await verifyCourseAccess(
            courseId,
            req.user
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found or access denied"
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
                ON m.id = l.module_id
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
            modules: result.rows
        });

    } catch (error) {
        console.error("Get course modules error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching modules"
        });
    }
};


/**
 * GET SINGLE MODULE
 */
const getModuleById = async (req, res) => {
    try {
        const { moduleId } = req.params;

        const result = await pool.query(
            `SELECT
                m.id,
                m.course_id,
                m.title,
                m.description,
                m.position,
                m.created_at,
                m.updated_at
             FROM modules m
             WHERE m.id = $1`,
            [moduleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        const module = result.rows[0];

        const course = await verifyCourseAccess(
            module.course_id,
            req.user
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Module not found or access denied"
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
                ...module,
                lessons: lessonsResult.rows
            }
        });

    } catch (error) {
        console.error("Get module error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching module"
        });
    }
};


/**
 * UPDATE MODULE
 */
const updateModule = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const {
            title,
            description,
            position
        } = req.body;

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

        const moduleResult = await pool.query(
            `SELECT
                id,
                course_id
             FROM modules
             WHERE id = $1`,
            [moduleId]
        );

        if (moduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        const module = moduleResult.rows[0];

        const course = await verifyCourseAccess(
            module.course_id,
            req.user
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Module not found or access denied"
            });
        }

        if (position !== undefined) {
            const duplicatePosition = await pool.query(
                `SELECT id
                 FROM modules
                 WHERE course_id = $1
                 AND position = $2
                 AND id <> $3`,
                [
                    module.course_id,
                    position,
                    moduleId
                ]
            );

            if (duplicatePosition.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "A module already exists at this position"
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

        if (description !== undefined) {
            fields.push(`description = $${index++}`);
            values.push(description?.trim() || null);
        }

        if (position !== undefined) {
            fields.push(`position = $${index++}`);
            values.push(position);
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");

        values.push(moduleId);

        const result = await pool.query(
            `UPDATE modules
             SET ${fields.join(", ")}
             WHERE id = $${index}
             RETURNING
                id,
                course_id,
                title,
                description,
                position,
                created_at,
                updated_at`,
            values
        );

        return res.json({
            success: true,
            message: "Module updated successfully",
            module: result.rows[0]
        });

    } catch (error) {
        console.error("Update module error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating module"
        });
    }
};


/**
 * DELETE MODULE
 */
const deleteModule = async (req, res) => {
    try {
        const { moduleId } = req.params;

        const moduleResult = await pool.query(
            `SELECT
                id,
                course_id,
                title
             FROM modules
             WHERE id = $1`,
            [moduleId]
        );

        if (moduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        const module = moduleResult.rows[0];

        const course = await verifyCourseAccess(
            module.course_id,
            req.user
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Module not found or access denied"
            });
        }

        const result = await pool.query(
            `DELETE FROM modules
             WHERE id = $1
             RETURNING id, course_id, title`,
            [moduleId]
        );

        return res.json({
            success: true,
            message: "Module deleted successfully",
            module: result.rows[0]
        });

    } catch (error) {
        console.error("Delete module error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting module"
        });
    }
};


module.exports = {
    createModule,
    getCourseModules,
    getModuleById,
    updateModule,
    deleteModule
};