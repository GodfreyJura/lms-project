const pool = require("../config/db");

/**
 * Verify that the authenticated user can manage a quiz.
 *
 * ADMIN:
 * Can manage quizzes belonging to courses in their institution.
 *
 * INSTRUCTOR:
 * Can manage quizzes belonging to courses assigned to them.
 */
const verifyQuizAccess = async (quizId, user) => {
    const result = await pool.query(
        `
        SELECT
            q.id,
            q.course_id,
            q.title,
            c.institution_id
        FROM quizzes q
        INNER JOIN courses c
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
        const assignment = await pool.query(
            `
            SELECT course_id
            FROM course_instructors
            WHERE course_id = $1
            AND instructor_id = $2
            `,
            [quiz.course_id, user.id]
        );

        if (assignment.rows.length === 0) {
            return null;
        }

        return quiz;
    }

    return null;
};

/**
 * Verify that a question exists and the current user
 * has access to its quiz.
 */
const getQuestionWithAccess = async (questionId, user) => {
    const result = await pool.query(
        `
        SELECT
            q.id,
            q.quiz_id,
            q.question_text,
            q.question_type,
            q.points,
            q.position,
            qu.course_id
        FROM questions q
        INNER JOIN quizzes qu
            ON q.quiz_id = qu.id
        INNER JOIN courses c
            ON qu.course_id = c.id
        WHERE q.id = $1
        AND c.institution_id = $2
        `,
        [questionId, user.institution_id]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const question = result.rows[0];

    if (user.role === "ADMIN") {
        return question;
    }

    if (user.role === "INSTRUCTOR") {
        const assignment = await pool.query(
            `
            SELECT course_id
            FROM course_instructors
            WHERE course_id = $1
            AND instructor_id = $2
            `,
            [question.course_id, user.id]
        );

        if (assignment.rows.length === 0) {
            return null;
        }

        return question;
    }

    return null;
};

/**
 * CREATE QUESTION
 */
const createQuestion = async (req, res) => {
    try {
        const { quizId } = req.params;

        const {
            question_text,
            question_type,
            points,
            position
        } = req.body;

        if (!question_text || !question_text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question text is required"
            });
        }

        if (position === undefined) {
            return res.status(400).json({
                success: false,
                message: "Question position is required"
            });
        }

        const normalizedPosition = Number(position);

        if (
            !Number.isInteger(normalizedPosition) ||
            normalizedPosition <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Question position must be a positive integer"
            });
        }

        const normalizedPoints =
            points === undefined ? 1 : Number(points);

        if (
            !Number.isInteger(normalizedPoints) ||
            normalizedPoints <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Question points must be a positive integer"
            });
        }

        const allowedTypes = [
            "MULTIPLE_CHOICE",
            "TRUE_FALSE",
            "SHORT_ANSWER"
        ];

        const normalizedType =
            question_type || "MULTIPLE_CHOICE";

        if (!allowedTypes.includes(normalizedType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question type"
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

        const duplicatePosition = await pool.query(
            `
            SELECT id
            FROM questions
            WHERE quiz_id = $1
            AND position = $2
            `,
            [quizId, normalizedPosition]
        );

        if (duplicatePosition.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A question already exists at this position"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO questions (
                quiz_id,
                question_text,
                question_type,
                points,
                position
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                quiz_id,
                question_text,
                question_type,
                points,
                position,
                created_at
            `,
            [
                quizId,
                question_text.trim(),
                normalizedType,
                normalizedPoints,
                normalizedPosition
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Question created successfully",
            question: result.rows[0]
        });

    } catch (error) {
        console.error("Create question error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating question"
        });
    }
};

/**
 * GET ALL QUESTIONS FOR A QUIZ
 */
const getQuizQuestions = async (req, res) => {
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
                id,
                quiz_id,
                question_text,
                question_type,
                points,
                position,
                created_at
            FROM questions
            WHERE quiz_id = $1
            ORDER BY position ASC
            `,
            [quizId]
        );

        const questions = [];

        for (const question of questionsResult.rows) {
            const optionsResult = await pool.query(
                `
                SELECT
                    id,
                    question_id,
                    option_text,
                    is_correct,
                    position
                FROM question_options
                WHERE question_id = $1
                ORDER BY position ASC
                `,
                [question.id]
            );

            questions.push({
                ...question,
                points: Number(question.points),
                options: optionsResult.rows
            });
        }

        return res.json({
            success: true,
            count: questions.length,
            questions
        });

    } catch (error) {
        console.error("Get quiz questions error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching questions"
        });
    }
};

/**
 * GET SINGLE QUESTION
 */
const getQuestionById = async (req, res) => {
    try {
        const { questionId } = req.params;

        const question = await getQuestionWithAccess(
            questionId,
            req.user
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found or access denied"
            });
        }

        const optionsResult = await pool.query(
            `
            SELECT
                id,
                question_id,
                option_text,
                is_correct,
                position
            FROM question_options
            WHERE question_id = $1
            ORDER BY position ASC
            `,
            [questionId]
        );

        return res.json({
            success: true,
            question: {
                ...question,
                points: Number(question.points),
                options: optionsResult.rows
            }
        });

    } catch (error) {
        console.error("Get question error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching question"
        });
    }
};

/**
 * UPDATE QUESTION
 */
const updateQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;

        const {
            question_text,
            question_type,
            points,
            position
        } = req.body;

        if (
            question_text === undefined &&
            question_type === undefined &&
            points === undefined &&
            position === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update"
            });
        }

        const question = await getQuestionWithAccess(
            questionId,
            req.user
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found or access denied"
            });
        }

        const fields = [];
        const values = [];
        let index = 1;

        if (question_text !== undefined) {
            const normalizedText = question_text.trim();

            if (!normalizedText) {
                return res.status(400).json({
                    success: false,
                    message: "Question text cannot be empty"
                });
            }

            fields.push(`question_text = $${index++}`);
            values.push(normalizedText);
        }

        if (question_type !== undefined) {
            const allowedTypes = [
                "MULTIPLE_CHOICE",
                "TRUE_FALSE",
                "SHORT_ANSWER"
            ];

            if (!allowedTypes.includes(question_type)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid question type"
                });
            }

            fields.push(`question_type = $${index++}`);
            values.push(question_type);
        }

        if (points !== undefined) {
            const normalizedPoints = Number(points);

            if (
                !Number.isInteger(normalizedPoints) ||
                normalizedPoints <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Question points must be a positive integer"
                });
            }

            fields.push(`points = $${index++}`);
            values.push(normalizedPoints);
        }

        if (position !== undefined) {
            const normalizedPosition = Number(position);

            if (
                !Number.isInteger(normalizedPosition) ||
                normalizedPosition <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Question position must be a positive integer"
                });
            }

            const duplicate = await pool.query(
                `
                SELECT id
                FROM questions
                WHERE quiz_id = $1
                AND position = $2
                AND id <> $3
                `,
                [
                    question.quiz_id,
                    normalizedPosition,
                    questionId
                ]
            );

            if (duplicate.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "A question already exists at this position"
                });
            }

            fields.push(`position = $${index++}`);
            values.push(normalizedPosition);
        }

        values.push(questionId);

        const result = await pool.query(
            `
            UPDATE questions
            SET ${fields.join(", ")}
            WHERE id = $${index}
            RETURNING
                id,
                quiz_id,
                question_text,
                question_type,
                points,
                position,
                created_at
            `,
            values
        );

        return res.json({
            success: true,
            message: "Question updated successfully",
            question: result.rows[0]
        });

    } catch (error) {
        console.error("Update question error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating question"
        });
    }
};

/**
 * DELETE QUESTION
 */
const deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;

        const question = await getQuestionWithAccess(
            questionId,
            req.user
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found or access denied"
            });
        }

        const result = await pool.query(
            `
            DELETE FROM questions
            WHERE id = $1
            RETURNING
                id,
                quiz_id,
                question_text,
                position
            `,
            [questionId]
        );

        return res.json({
            success: true,
            message: "Question deleted successfully",
            question: result.rows[0]
        });

    } catch (error) {
        console.error("Delete question error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting question"
        });
    }
};

/**
 * CREATE OPTION
 */
const createOption = async (req, res) => {
    try {
        const { questionId } = req.params;

        const {
            option_text,
            is_correct,
            position
        } = req.body;

        if (!option_text || !option_text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Option text is required"
            });
        }

        if (position === undefined) {
            return res.status(400).json({
                success: false,
                message: "Option position is required"
            });
        }

        const normalizedPosition = Number(position);

        if (
            !Number.isInteger(normalizedPosition) ||
            normalizedPosition <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Option position must be a positive integer"
            });
        }

        const question = await getQuestionWithAccess(
            questionId,
            req.user
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found or access denied"
            });
        }

        const duplicate = await pool.query(
            `
            SELECT id
            FROM question_options
            WHERE question_id = $1
            AND position = $2
            `,
            [questionId, normalizedPosition]
        );

        if (duplicate.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An option already exists at this position"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO question_options (
                question_id,
                option_text,
                is_correct,
                position
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                question_id,
                option_text,
                is_correct,
                position
            `,
            [
                questionId,
                option_text.trim(),
                is_correct === true,
                normalizedPosition
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Option created successfully",
            option: result.rows[0]
        });

    } catch (error) {
        console.error("Create option error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating option"
        });
    }
};

/**
 * UPDATE OPTION
 */
const updateOption = async (req, res) => {
    try {
        const { optionId } = req.params;

        const {
            option_text,
            is_correct,
            position
        } = req.body;

        if (
            option_text === undefined &&
            is_correct === undefined &&
            position === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update"
            });
        }

        const optionResult = await pool.query(
            `
            SELECT
                qo.id,
                qo.question_id,
                qo.option_text,
                qo.is_correct,
                qo.position
            FROM question_options qo
            WHERE qo.id = $1
            `,
            [optionId]
        );

        if (optionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Option not found"
            });
        }

        const option = optionResult.rows[0];

        const question = await getQuestionWithAccess(
            option.question_id,
            req.user
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Option not found or access denied"
            });
        }

        const fields = [];
        const values = [];
        let index = 1;

        if (option_text !== undefined) {
            const normalizedText = option_text.trim();

            if (!normalizedText) {
                return res.status(400).json({
                    success: false,
                    message: "Option text cannot be empty"
                });
            }

            fields.push(`option_text = $${index++}`);
            values.push(normalizedText);
        }

        if (is_correct !== undefined) {
            if (typeof is_correct !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "is_correct must be a boolean"
                });
            }

            fields.push(`is_correct = $${index++}`);
            values.push(is_correct);
        }

        if (position !== undefined) {
            const normalizedPosition = Number(position);

            if (
                !Number.isInteger(normalizedPosition) ||
                normalizedPosition <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Option position must be a positive integer"
                });
            }

            const duplicate = await pool.query(
                `
                SELECT id
                FROM question_options
                WHERE question_id = $1
                AND position = $2
                AND id <> $3
                `,
                [
                    option.question_id,
                    normalizedPosition,
                    optionId
                ]
            );

            if (duplicate.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "An option already exists at this position"
                });
            }

            fields.push(`position = $${index++}`);
            values.push(normalizedPosition);
        }

        values.push(optionId);

        const result = await pool.query(
            `
            UPDATE question_options
            SET ${fields.join(", ")}
            WHERE id = $${index}
            RETURNING
                id,
                question_id,
                option_text,
                is_correct,
                position
            `,
            values
        );

        return res.json({
            success: true,
            message: "Option updated successfully",
            option: result.rows[0]
        });

    } catch (error) {
        console.error("Update option error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating option"
        });
    }
};

/**
 * DELETE OPTION
 */
const deleteOption = async (req, res) => {
    try {
        const { optionId } = req.params;

        const optionResult = await pool.query(
            `
            SELECT
                id,
                question_id,
                option_text,
                position
            FROM question_options
            WHERE id = $1
            `,
            [optionId]
        );

        if (optionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Option not found"
            });
        }

        const option = optionResult.rows[0];

        const question = await getQuestionWithAccess(
            option.question_id,
            req.user
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Option not found or access denied"
            });
        }

        const result = await pool.query(
            `
            DELETE FROM question_options
            WHERE id = $1
            RETURNING
                id,
                question_id,
                option_text,
                position
            `,
            [optionId]
        );

        return res.json({
            success: true,
            message: "Option deleted successfully",
            option: result.rows[0]
        });

    } catch (error) {
        console.error("Delete option error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting option"
        });
    }
};

module.exports = {
    createQuestion,
    getQuizQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    createOption,
    updateOption,
    deleteOption
};
