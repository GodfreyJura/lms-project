const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| CREATE MODULE
|--------------------------------------------------------------------------
*/
const createInstructorModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;

    const instructorId = req.user.id;
    const institutionId = req.user.institution_id;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Module title is required",
      });
    }

    const courseResult = await pool.query(
      `
      SELECT c.id
      FROM courses c
      INNER JOIN course_instructors ci
        ON ci.course_id = c.id
      WHERE c.id = $1
        AND ci.instructor_id = $2
        AND c.institution_id = $3
      `,
      [courseId, instructorId, institutionId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Course not found or you are not assigned to this course",
      });
    }

    const positionResult = await pool.query(
      `
      SELECT COALESCE(MAX(position), 0) + 1 AS next_position
      FROM modules
      WHERE course_id = $1
      `,
      [courseId]
    );

    const nextPosition = Number(
      positionResult.rows[0].next_position
    );

    const result = await pool.query(
      `
      INSERT INTO modules (
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
        position
      `,
      [
        courseId,
        title.trim(),
        description?.trim() || null,
        nextPosition,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Module created successfully",
      module: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create instructor module error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating module",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET MODULES
|--------------------------------------------------------------------------
*/
const getInstructorModules = async (req, res) => {
  try {
    const { courseId } = req.params;

    const instructorId = req.user.id;
    const institutionId = req.user.institution_id;

    const courseResult = await pool.query(
      `
      SELECT c.id
      FROM courses c
      INNER JOIN course_instructors ci
        ON ci.course_id = c.id
      WHERE c.id = $1
        AND ci.instructor_id = $2
        AND c.institution_id = $3
      `,
      [courseId, instructorId, institutionId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Course not found or you are not assigned to this course",
      });
    }

    const result = await pool.query(
      `
      SELECT
        m.id,
        m.course_id,
        m.title,
        m.description,
        m.position,
        COUNT(l.id)::int AS lesson_count
      FROM modules m
      LEFT JOIN lessons l
        ON l.module_id = m.id
      WHERE m.course_id = $1
      GROUP BY
        m.id,
        m.course_id,
        m.title,
        m.description,
        m.position
      ORDER BY m.position ASC
      `,
      [courseId]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      modules: result.rows,
    });
  } catch (error) {
    console.error(
      "Get instructor modules error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching modules",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE MODULE
|--------------------------------------------------------------------------
*/
const updateInstructorModule = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { title, description } = req.body;

    const instructorId = req.user.id;
    const institutionId = req.user.institution_id;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Module title is required",
      });
    }

    const result = await pool.query(
      `
      UPDATE modules m
      SET
        title = $1,
        description = $2,
        updated_at = CURRENT_TIMESTAMP
      FROM courses c
      INNER JOIN course_instructors ci
        ON ci.course_id = c.id
      WHERE m.id = $3
        AND m.course_id = $4
        AND m.course_id = c.id
        AND ci.instructor_id = $5
        AND c.institution_id = $6
      RETURNING
        m.id,
        m.course_id,
        m.title,
        m.description,
        m.position
      `,
      [
        title.trim(),
        description?.trim() || null,
        moduleId,
        courseId,
        instructorId,
        institutionId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Module not found or you are not assigned to this course",
      });
    }

    return res.json({
      success: true,
      message: "Module updated successfully",
      module: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update instructor module error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating module",
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE MODULE
|--------------------------------------------------------------------------
*/
const deleteInstructorModule = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;

    const instructorId = req.user.id;
    const institutionId = req.user.institution_id;

    const result = await pool.query(
      `
      DELETE FROM modules m
      USING courses c, course_instructors ci
      WHERE m.id = $1
        AND m.course_id = $2
        AND m.course_id = c.id
        AND ci.course_id = c.id
        AND ci.instructor_id = $3
        AND c.institution_id = $4
      RETURNING m.id
      `,
      [
        moduleId,
        courseId,
        instructorId,
        institutionId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Module not found or you are not assigned to this course",
      });
    }

    return res.json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete instructor module error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete module. Make sure the module can be deleted safely.",
    });
  }
};

module.exports = {
  createInstructorModule,
  getInstructorModules,
  updateInstructorModule,
  deleteInstructorModule,
};