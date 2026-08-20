const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| CREATE LESSON
|--------------------------------------------------------------------------
*/
const createInstructorLesson = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const {
      title,
      content,
      video_url,
      duration_minutes,
      is_published,
    } = req.body;

    const instructorId = req.user.id;
    const institutionId = req.user.institution_id;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Lesson title is required",
      });
    }

    const moduleResult = await pool.query(
      `
      SELECT m.id
      FROM modules m
      INNER JOIN courses c
        ON c.id = m.course_id
      INNER JOIN course_instructors ci
        ON ci.course_id = c.id
      WHERE m.id = $1
        AND ci.instructor_id = $2
        AND c.institution_id = $3
      `,
      [moduleId, instructorId, institutionId]
    );

    if (moduleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Module not found or you are not assigned to this course",
      });
    }

    const positionResult = await pool.query(
      `
      SELECT COALESCE(MAX(position), 0) + 1 AS next_position
      FROM lessons
      WHERE module_id = $1
      `,
      [moduleId]
    );

    const nextPosition = Number(
      positionResult.rows[0].next_position
    );

    const result = await pool.query(
      `
      INSERT INTO lessons (
        module_id,
        title,
        content,
        video_url,
        position,
        duration_minutes,
        is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        module_id,
        title,
        content,
        video_url,
        position,
        duration_minutes,
        is_published
      `,
      [
        moduleId,
        title.trim(),
        content?.trim() || null,
        video_url?.trim() || null,
        nextPosition,
        duration_minutes === null ||
        duration_minutes === undefined ||
        duration_minutes === ""
          ? null
          : Number(duration_minutes),
        Boolean(is_published),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      lesson: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create instructor lesson error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating lesson",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET LESSONS
|--------------------------------------------------------------------------
*/
const getInstructorLessons = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const instructorId = req.user.id;
    const institutionId = req.user.institution_id;

    const moduleResult = await pool.query(
      `
      SELECT m.id
      FROM modules m
      INNER JOIN courses c
        ON c.id = m.course_id
      INNER JOIN course_instructors ci
        ON ci.course_id = c.id
      WHERE m.id = $1
        AND ci.instructor_id = $2
        AND c.institution_id = $3
      `,
      [moduleId, instructorId, institutionId]
    );

    if (moduleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Module not found or you are not assigned to this course",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        module_id,
        title,
        content,
        video_url,
        position,
        duration_minutes,
        is_published
      FROM lessons
      WHERE module_id = $1
      ORDER BY position ASC
      `,
      [moduleId]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      lessons: result.rows,
    });
  } catch (error) {
    console.error(
      "Get instructor lessons error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching lessons",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE LESSON
|--------------------------------------------------------------------------
*/
const updateInstructorLesson = async (req, res) => {
  try {
    const { moduleId, lessonId } = req.params;

    const {
      title,
      content,
      video_url,
      duration_minutes,
      is_published,
    } = req.body;

    const instructorId = req.user.id;
    const institutionId = req.user.institution_id;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Lesson title is required",
      });
    }

    const result = await pool.query(
      `
      UPDATE lessons l
      SET
        title = $1,
        content = $2,
        video_url = $3,
        duration_minutes = $4,
        is_published = $5,
        updated_at = CURRENT_TIMESTAMP
      FROM modules m
      INNER JOIN courses c
        ON c.id = m.course_id
      INNER JOIN course_instructors ci
        ON ci.course_id = c.id
      WHERE l.id = $6
        AND l.module_id = $7
        AND l.module_id = m.id
        AND ci.instructor_id = $8
        AND c.institution_id = $9
      RETURNING
        l.id,
        l.module_id,
        l.title,
        l.content,
        l.video_url,
        l.position,
        l.duration_minutes,
        l.is_published
      `,
      [
        title.trim(),
        content?.trim() || null,
        video_url?.trim() || null,
        duration_minutes === null ||
        duration_minutes === undefined ||
        duration_minutes === ""
          ? null
          : Number(duration_minutes),
        Boolean(is_published),
        lessonId,
        moduleId,
        instructorId,
        institutionId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Lesson not found or you are not assigned to this course",
      });
    }

    return res.json({
      success: true,
      message: "Lesson updated successfully",
      lesson: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update instructor lesson error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating lesson",
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE LESSON
|--------------------------------------------------------------------------
*/
const deleteInstructorLesson = async (req, res) => {
  try {
    const { moduleId, lessonId } = req.params;

    const instructorId = req.user.id;
    const institutionId = req.user.institution_id;

    const result = await pool.query(
      `
      DELETE FROM lessons l
      USING modules m, courses c, course_instructors ci
      WHERE l.id = $1
        AND l.module_id = $2
        AND l.module_id = m.id
        AND m.course_id = c.id
        AND ci.course_id = c.id
        AND ci.instructor_id = $3
        AND c.institution_id = $4
      RETURNING l.id
      `,
      [
        lessonId,
        moduleId,
        instructorId,
        institutionId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Lesson not found or you are not assigned to this course",
      });
    }

    return res.json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete instructor lesson error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting lesson",
    });
  }
};

/*
|--------------------------------------------------------------------------
| TOGGLE LESSON PUBLICATION
|--------------------------------------------------------------------------
*/
const toggleLessonPublication = async (req, res) => {
  try {
    const { moduleId, lessonId } = req.params;

    const instructorId = req.user.id;
    const institutionId = req.user.institution_id;

    const result = await pool.query(
      `
      UPDATE lessons l
      SET
        is_published = NOT l.is_published,
        updated_at = CURRENT_TIMESTAMP
      FROM modules m
      INNER JOIN courses c
        ON c.id = m.course_id
      INNER JOIN course_instructors ci
        ON ci.course_id = c.id
      WHERE l.id = $1
        AND l.module_id = $2
        AND l.module_id = m.id
        AND ci.instructor_id = $3
        AND c.institution_id = $4
      RETURNING
        l.id,
        l.module_id,
        l.title,
        l.is_published
      `,
      [
        lessonId,
        moduleId,
        instructorId,
        institutionId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Lesson not found or you are not assigned to this course",
      });
    }

    const lesson = result.rows[0];

    return res.json({
      success: true,
      message: lesson.is_published
        ? "Lesson published successfully"
        : "Lesson unpublished successfully",
      lesson,
    });
  } catch (error) {
    console.error(
      "Toggle lesson publication error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while changing lesson publication",
    });
  }
};

module.exports = {
  createInstructorLesson,
  getInstructorLessons,
  updateInstructorLesson,
  deleteInstructorLesson,
  toggleLessonPublication,
};