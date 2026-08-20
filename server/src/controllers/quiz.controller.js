const pool = require("../config/db");

/**
 * Verify that the authenticated user can manage a course.
 *
 * ADMIN:
 * Can manage any course in their institution.
 *
 * INSTRUCTOR:
 * Can manage only courses assigned to them.
 */
const verifyCourseAccess = async (courseId, user) => {
    const courseResult = await pool.query(
        `
        SELECT
            c.id,
            c.institution_id,
            c.title,
            c.status
        FROM courses c
        WHERE c.id = $1
        AND c.institution_id = $2
        `,
        [courseId, user.institution_id]
    );

    if (courseResult.rows.length === 0) {
        return null;
    }

    const course = courseResult.rows[0];

    if (user.role === "ADMIN") {
        return course;
    }

    if (user.role === "INSTRUCTOR") {
        const assignmentResult = await pool.query(
            `
            SELECT course_id
            FROM course_instructors
            WHERE course_id = $1
            AND instructor_id = $2
            `,
            [courseId, user.id]
        );

        if (assignmentResult.rows.length === 0) {
            return null;
        }

        return course;
    }

    return null;
};

/**
 * Verify that the authenticated user can manage a quiz.
 */
const verifyQuizAccess = async (quizId, user) => {
    const result = await pool.query(
        `
        SELECT
            q.id,
            q.course_id,
            q.title,
            q.description,
            q.time_limit_minutes,
            q.max_attempts,
            q.is_published,
            c.institution_id,
            c.title AS course_title,
            c.status AS course_status
        FROM quizzes q
        JOIN courses c
            ON q.course_id = c.id
        WHERE q.id = $1
        AND c.institution_id = $2
        `,
        [quizId, user.institution_id]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const quiz = result.rows[0];

    if (user.role === "ADMIN") {
        return quiz;
    }

    if (user.role === "INSTRUCTOR") {
        const assignmentResult = await pool.query(
            `
            SELECT course_id
            FROM course_instructors
            WHERE course_id = $1
            AND instructor_id = $2
            `,
            [quiz.course_id, user.id]
        );

        if (assignmentResult.rows.length === 0) {
            return null;
        }

        return quiz;
    }

    return null;
};

/**
 * CREATE QUIZ
 */
const createQuiz = async (req, res) => {
    try {
        const { courseId } = req.params;

        const {
            title,
            description,
            time_limit_minutes,
            max_attempts,
            is_published
        } = req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required"
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Quiz title is required"
            });
        }

        if (
            time_limit_minutes !== undefined &&
            (
                !Number.isInteger(Number(time_limit_minutes)) ||
                Number(time_limit_minutes) <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Time limit must be a positive integer"
            });
        }

        if (
            max_attempts !== undefined &&
            (
                !Number.isInteger(Number(max_attempts)) ||
                Number(max_attempts) <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Maximum attempts must be a positive integer"
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

        const result = await pool.query(
            `
            INSERT INTO quizzes (
                course_id,
                title,
                description,
                time_limit_minutes,
                max_attempts,
                is_published
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                course_id,
                title,
                description,
                time_limit_minutes,
                max_attempts,
                is_published,
                created_at,
                updated_at
            `,
            [
                courseId,
                title.trim(),
                description?.trim() || null,
                time_limit_minutes !== undefined
                    ? Number(time_limit_minutes)
                    : null,
                max_attempts !== undefined
                    ? Number(max_attempts)
                    : 1,
                is_published === true
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Quiz created successfully",
            quiz: result.rows[0]
        });

    } catch (error) {
        console.error("Create quiz error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating quiz"
        });
    }
};

/**
 * GET ALL QUIZZES FOR A COURSE
 */
const getCourseQuizzes = async (req, res) => {
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
            `
            SELECT
                q.id,
                q.course_id,
                q.title,
                q.description,
                q.time_limit_minutes,
                q.max_attempts,
                q.is_published,
                q.created_at,
                q.updated_at,

                COUNT(DISTINCT qu.id) AS question_count,

                COALESCE(
                    SUM(qu.points),
                    0
                ) AS total_points

            FROM quizzes q

            LEFT JOIN questions qu
                ON qu.quiz_id = q.id

            WHERE q.course_id = $1

            GROUP BY
                q.id,
                q.course_id,
                q.title,
                q.description,
                q.time_limit_minutes,
                q.max_attempts,
                q.is_published,
                q.created_at,
                q.updated_at

            ORDER BY q.created_at DESC
            `,
            [courseId]
        );

        const quizzes = result.rows.map((quiz) => ({
            ...quiz,
            question_count: Number(quiz.question_count),
            total_points: Number(quiz.total_points)
        }));

        return res.json({
            success: true,
            count: quizzes.length,
            quizzes
        });

    } catch (error) {
        console.error("Get course quizzes error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching quizzes"
        });
    }
};

/**
 * GET SINGLE QUIZ
 */
const getQuizById = async (req, res) => {
    try {
        const { quizId } = req.params;

        const quiz = await verifyQuizAccess(
            quizId,
            req.user
        );

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found or access denied"
            });
        }

        const questionsResult = await pool.query(
            `
            SELECT
                q.id,
                q.quiz_id,
                q.question_text,
                q.question_type,
                q.points,
                q.position
            FROM questions q
            WHERE q.quiz_id = $1
            ORDER BY q.position ASC
            `,
            [quizId]
        );

        const optionsResult = await pool.query(
            `
            SELECT
                qo.id,
                qo.question_id,
                qo.option_text,
                qo.is_correct,
                qo.position
            FROM question_options qo
            JOIN questions q
                ON qo.question_id = q.id
            WHERE q.quiz_id = $1
            ORDER BY qo.position ASC
            `,
            [quizId]
        );

        const questions = questionsResult.rows.map((question) => ({
            ...question,
            points: Number(question.points),
            options: optionsResult.rows.filter(
                (option) => option.question_id === question.id
            )
        }));

        const totalPoints = questions.reduce(
            (total, question) => total + question.points,
            0
        );

        return res.json({
            success: true,
            quiz: {
                ...quiz,
                questions,
                statistics: {
                    total_questions: questions.length,
                    total_points: totalPoints
                }
            }
        });

    } catch (error) {
        console.error("Get quiz error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching quiz"
        });
    }
};

/**
 * UPDATE QUIZ
 */
const updateQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;

        const {
            title,
            description,
            time_limit_minutes,
            max_attempts,
            is_published
        } = req.body;

        if (
            title === undefined &&
            description === undefined &&
            time_limit_minutes === undefined &&
            max_attempts === undefined &&
            is_published === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update"
            });
        }

        const quiz = await verifyQuizAccess(
            quizId,
            req.user
        );

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found or access denied"
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
                    message: "Quiz title cannot be empty"
                });
            }

            fields.push(`title = $${index++}`);
            values.push(normalizedTitle);
        }

        if (description !== undefined) {
            fields.push(`description = $${index++}`);
            values.push(description?.trim() || null);
        }

        if (time_limit_minutes !== undefined) {
            if (
                !Number.isInteger(Number(time_limit_minutes)) ||
                Number(time_limit_minutes) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Time limit must be a positive integer"
                });
            }

            fields.push(`time_limit_minutes = $${index++}`);
            values.push(Number(time_limit_minutes));
        }

        if (max_attempts !== undefined) {
            if (
                !Number.isInteger(Number(max_attempts)) ||
                Number(max_attempts) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum attempts must be a positive integer"
                });
            }

            fields.push(`max_attempts = $${index++}`);
            values.push(Number(max_attempts));
        }

        if (is_published !== undefined) {
            if (typeof is_published !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "is_published must be a boolean"
                });
            }

            fields.push(`is_published = $${index++}`);
            values.push(is_published);
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");

        values.push(quizId);

        const result = await pool.query(
            `
            UPDATE quizzes
            SET ${fields.join(", ")}
            WHERE id = $${index}
            RETURNING
                id,
                course_id,
                title,
                description,
                time_limit_minutes,
                max_attempts,
                is_published,
                created_at,
                updated_at
            `,
            values
        );

        return res.json({
            success: true,
            message: "Quiz updated successfully",
            quiz: result.rows[0]
        });

    } catch (error) {
        console.error("Update quiz error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating quiz"
        });
    }
};

/**
 * DELETE QUIZ
 */
const deleteQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;

        const quiz = await verifyQuizAccess(
            quizId,
            req.user
        );

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found or access denied"
            });
        }

        const result = await pool.query(
            `
            DELETE FROM quizzes
            WHERE id = $1
            RETURNING
                id,
                course_id,
                title
            `,
            [quizId]
        );

        return res.json({
            success: true,
            message: "Quiz deleted successfully",
            quiz: result.rows[0]
        });

    } catch (error) {
        console.error("Delete quiz error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting quiz"
        });
    }
};
const getPublishedCourseQuizzes = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;
        const institutionId = req.user.institution_id;

        // Verify student is enrolled in the course
        const enrollmentResult = await pool.query(
            `SELECT id, status
             FROM enrollments
             WHERE student_id = $1
             AND course_id = $2`,
            [studentId, courseId]
        );

        if (enrollmentResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this course"
            });
        }

        if (enrollmentResult.rows[0].status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Your enrollment is not active"
            });
        }

        // Get published quizzes for this course
        const quizzesResult = await pool.query(
            `SELECT
                q.id,
                q.title,
                q.description,
                q.time_limit_minutes,
                q.max_attempts,
                q.is_published,
                q.created_at,
                c.institution_id
             FROM quizzes q
             JOIN courses c
                ON q.course_id = c.id
             WHERE q.course_id = $1
             AND q.is_published = TRUE
             AND c.institution_id = $2
             ORDER BY q.created_at DESC`,
            [courseId, institutionId]
        );

        // Get attempt counts for each quiz
        const quizzes = [];

        for (const quiz of quizzesResult.rows) {
            const attemptsResult = await pool.query(
                `SELECT COUNT(*) AS attempt_count
                 FROM quiz_attempts
                 WHERE quiz_id = $1
                 AND student_id = $2`,
                [quiz.id, studentId]
            );

            const attemptCount = Number(
                attemptsResult.rows[0].attempt_count
            );

            quizzes.push({
                ...quiz,
                attempt_count: attemptCount,
                can_attempt: attemptCount < quiz.max_attempts
            });
        }

        return res.json({
            success: true,
            count: quizzes.length,
            quizzes
        });
    } catch (error) {
        console.error("Get published course quizzes error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching quizzes"
        });
    }
};
module.exports = {
    createQuiz,
    getCourseQuizzes,
    getPublishedCourseQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz
};