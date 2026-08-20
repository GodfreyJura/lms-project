const pool = require("../config/db");

const startQuizAttempt = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { quizId } = req.params;

        const quizResult = await pool.query(
            `
            SELECT
                q.id,
                q.title,
                q.description,
                q.course_id,
                q.time_limit_minutes,
                q.max_attempts,
                q.is_published,
                c.title AS course_title
            FROM quizzes q
            JOIN courses c
                ON q.course_id = c.id
            WHERE q.id = $1
            AND c.institution_id = $2
            `,
            [quizId, req.user.institution_id]
        );

        if (quizResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        const quiz = quizResult.rows[0];

        if (!quiz.is_published) {
            return res.status(403).json({
                success: false,
                message: "This quiz is not published"
            });
        }

        const enrollmentResult = await pool.query(
            `
            SELECT id, status
            FROM enrollments
            WHERE student_id = $1
            AND course_id = $2
            `,
            [studentId, quiz.course_id]
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

        const attemptsResult = await pool.query(
            `
            SELECT COUNT(*) AS attempt_count
            FROM quiz_attempts
            WHERE quiz_id = $1
            AND student_id = $2
            `,
            [quizId, studentId]
        );

        const attemptCount = Number(
            attemptsResult.rows[0].attempt_count
        );

        if (attemptCount >= quiz.max_attempts) {
            return res.status(403).json({
                success: false,
                message: "Maximum number of attempts reached"
            });
        }

        const attemptNumber = attemptCount + 1;

        const attemptResult = await pool.query(
            `
            INSERT INTO quiz_attempts (
                quiz_id,
                student_id,
                attempt_number
            )
            VALUES ($1, $2, $3)
            RETURNING
                id,
                quiz_id,
                attempt_number,
                started_at
            `,
            [
                quizId,
                studentId,
                attemptNumber
            ]
        );

        const questionsResult = await pool.query(
            `
            SELECT
                q.id,
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
                qo.position
            FROM question_options qo
            JOIN questions q
                ON qo.question_id = q.id
            WHERE q.quiz_id = $1
            ORDER BY qo.position ASC
            `,
            [quizId]
        );

        const questions = questionsResult.rows.map(question => ({
            ...question,
            points: Number(question.points),
            options: optionsResult.rows.filter(
                option => option.question_id === question.id
            )
        }));

        return res.status(201).json({
            success: true,
            message: "Quiz attempt started successfully",
            attempt: attemptResult.rows[0],
            quiz: {
                id: quiz.id,
                title: quiz.title,
                description: quiz.description,
                course_id: quiz.course_id,
                course_title: quiz.course_title,
                time_limit_minutes: quiz.time_limit_minutes,
                max_attempts: quiz.max_attempts
            },
            questions
        });
    } catch (error) {
        console.error("Start quiz attempt error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while starting quiz attempt"
        });
    }
};

const getQuizAttempt = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { attemptId } = req.params;

        const attemptResult = await pool.query(
            `
            SELECT
                qa.id,
                qa.quiz_id,
                qa.student_id,
                qa.attempt_number,
                qa.score,
                qa.started_at,
                qa.submitted_at,
                q.title AS quiz_title,
                q.time_limit_minutes,
                q.max_attempts
            FROM quiz_attempts qa
            JOIN quizzes q
                ON qa.quiz_id = q.id
            WHERE qa.id = $1
            AND qa.student_id = $2
            `,
            [attemptId, studentId]
        );

        if (attemptResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Quiz attempt not found"
            });
        }

        const attempt = attemptResult.rows[0];

        const answersResult = await pool.query(
            `
            SELECT
                id,
                question_id,
                selected_option_id,
                answer_text,
                is_correct,
                points_earned
            FROM quiz_answers
            WHERE attempt_id = $1
            ORDER BY id
            `,
            [attemptId]
        );

        return res.json({
            success: true,
            attempt,
            answers: answersResult.rows
        });
    } catch (error) {
        console.error("Get quiz attempt error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching quiz attempt"
        });
    }
};

const submitQuizAttempt = async (req, res) => {
    const client = await pool.connect();

    try {
        const studentId = req.user.id;
        const { attemptId } = req.params;
        const { answers } = req.body;

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "Answers must be an array"
            });
        }

        await client.query("BEGIN");

        const attemptResult = await client.query(
            `
            SELECT
                qa.id,
                qa.quiz_id,
                qa.student_id,
                qa.attempt_number,
                qa.score,
                qa.started_at,
                qa.submitted_at,
                q.title AS quiz_title,
                q.time_limit_minutes
            FROM quiz_attempts qa
            JOIN quizzes q
                ON qa.quiz_id = q.id
            WHERE qa.id = $1
            AND qa.student_id = $2
            FOR UPDATE
            `,
            [attemptId, studentId]
        );

        if (attemptResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Quiz attempt not found"
            });
        }

        const attempt = attemptResult.rows[0];

        if (attempt.submitted_at) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "This quiz attempt has already been submitted"
            });
        }

        if (
            attempt.time_limit_minutes !== null &&
            attempt.time_limit_minutes !== undefined
        ) {
            const startedAt = new Date(attempt.started_at);
            const now = new Date();

            const elapsedMinutes =
                (now.getTime() - startedAt.getTime()) / 60000;

            if (elapsedMinutes > Number(attempt.time_limit_minutes)) {
                await client.query(
                    `
                    UPDATE quiz_attempts
                    SET
                        submitted_at = CURRENT_TIMESTAMP,
                        score = 0
                    WHERE id = $1
                    `,
                    [attemptId]
                );

                await client.query("COMMIT");

                return res.status(400).json({
                    success: false,
                    message: "Quiz time limit has expired",
                    attempt: {
                        id: attempt.id,
                        quiz_id: attempt.quiz_id,
                        attempt_number: attempt.attempt_number,
                        score: 0,
                        submitted_at: new Date()
                    }
                });
            }
        }

        const questionsResult = await client.query(
            `
            SELECT
                q.id,
                q.question_text,
                q.question_type,
                q.points,
                q.position
            FROM questions q
            WHERE q.quiz_id = $1
            ORDER BY q.position ASC
            `,
            [attempt.quiz_id]
        );

        if (questionsResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Quiz has no questions"
            });
        }

        const questionIds = new Set(
            questionsResult.rows.map(question => question.id)
        );

        const submittedQuestionIds = new Set();

        for (const answer of answers) {
            if (!answer.question_id) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: "Each answer must contain a question_id"
                });
            }

            if (!questionIds.has(answer.question_id)) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: "One or more answers contain an invalid question"
                });
            }

            if (submittedQuestionIds.has(answer.question_id)) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: "Duplicate answer submitted for a question"
                });
            }

            submittedQuestionIds.add(answer.question_id);
        }

        let totalPoints = 0;
        let earnedPoints = 0;
        const gradedAnswers = [];

        for (const question of questionsResult.rows) {
            const points = Number(question.points) || 0;
            totalPoints += points;

            const submittedAnswer = answers.find(
                answer => answer.question_id === question.id
            );

            let selectedOptionId = null;
            let answerText = null;
            let isCorrect = false;
            let pointsEarned = 0;

            if (submittedAnswer) {
                selectedOptionId =
                    submittedAnswer.selected_option_id || null;

                answerText =
                    submittedAnswer.answer_text || null;

                if (selectedOptionId) {
                    const optionResult = await client.query(
                        `
                        SELECT
                            id,
                            is_correct
                        FROM question_options
                        WHERE id = $1
                        AND question_id = $2
                        `,
                        [
                            selectedOptionId,
                            question.id
                        ]
                    );

                    if (optionResult.rows.length === 0) {
                        await client.query("ROLLBACK");

                        return res.status(400).json({
                            success: false,
                            message: "Invalid option submitted for a question"
                        });
                    }

                    isCorrect =
                        optionResult.rows[0].is_correct === true;
                }

                if (
                    question.question_type === "MULTIPLE_CHOICE" &&
                    isCorrect
                ) {
                    pointsEarned = points;
                }
            }

            earnedPoints += pointsEarned;

            const answerResult = await client.query(
                `
                INSERT INTO quiz_answers (
                    attempt_id,
                    question_id,
                    selected_option_id,
                    answer_text,
                    is_correct,
                    points_earned
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING
                    id,
                    attempt_id,
                    question_id,
                    selected_option_id,
                    answer_text,
                    is_correct,
                    points_earned
                `,
                [
                    attemptId,
                    question.id,
                    selectedOptionId,
                    answerText,
                    isCorrect,
                    pointsEarned
                ]
            );

            gradedAnswers.push({
                ...answerResult.rows[0],
                points_earned: Number(
                    answerResult.rows[0].points_earned || 0
                )
            });
        }

        const score =
            totalPoints === 0
                ? 0
                : Number(
                    ((earnedPoints / totalPoints) * 100).toFixed(2)
                );

        const updatedAttemptResult = await client.query(
            `
            UPDATE quiz_attempts
            SET
                score = $1,
                submitted_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING
                id,
                quiz_id,
                student_id,
                attempt_number,
                score,
                started_at,
                submitted_at
            `,
            [score, attemptId]
        );

        await client.query("COMMIT");

        return res.json({
            success: true,
            message: "Quiz submitted successfully",
            attempt: updatedAttemptResult.rows[0],
            result: {
                total_points: totalPoints,
                earned_points: earnedPoints,
                score,
                total_questions: questionsResult.rows.length,
                answered_questions: answers.length
            },
            answers: gradedAnswers
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Submit quiz attempt error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while submitting quiz attempt"
        });
    } finally {
        client.release();
    }
};

const getStudentQuizHistory = async (req, res) => {
    try {
        const studentId = req.user.id;

        const result = await pool.query(
            `
            SELECT
                qa.id AS attempt_id,
                qa.quiz_id,
                qa.attempt_number,
                qa.score,
                qa.started_at,
                qa.submitted_at,
                q.title AS quiz_title,
                q.course_id,
                c.title AS course_title,
                COUNT(que.id) AS total_questions,
                COALESCE(SUM(que.points), 0) AS total_points
            FROM quiz_attempts qa
            JOIN quizzes q
                ON qa.quiz_id = q.id
            JOIN courses c
                ON q.course_id = c.id
            LEFT JOIN questions que
                ON que.quiz_id = q.id
            WHERE qa.student_id = $1
            AND c.institution_id = $2
            GROUP BY
                qa.id,
                qa.quiz_id,
                qa.attempt_number,
                qa.score,
                qa.started_at,
                qa.submitted_at,
                q.title,
                q.course_id,
                c.title
            ORDER BY qa.started_at DESC
            `,
            [studentId, req.user.institution_id]
        );

        const attempts = result.rows.map(attempt => ({
            ...attempt,
            total_questions: Number(attempt.total_questions),
            total_points: Number(attempt.total_points),
            score: attempt.score === null
                ? null
                : Number(attempt.score)
        }));

        return res.json({
            success: true,
            count: attempts.length,
            attempts
        });
    } catch (error) {
        console.error("Get student quiz history error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching quiz history"
        });
    }
};

const getQuizAttemptResult = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { attemptId } = req.params;

        const attemptResult = await pool.query(
            `
            SELECT
                qa.id AS attempt_id,
                qa.quiz_id,
                qa.student_id,
                qa.attempt_number,
                qa.score,
                qa.started_at,
                qa.submitted_at,
                q.title AS quiz_title,
                q.description AS quiz_description,
                q.course_id,
                c.title AS course_title
            FROM quiz_attempts qa
            JOIN quizzes q
                ON qa.quiz_id = q.id
            JOIN courses c
                ON q.course_id = c.id
            WHERE qa.id = $1
            AND qa.student_id = $2
            AND c.institution_id = $3
            `,
            [
                attemptId,
                studentId,
                req.user.institution_id
            ]
        );

        if (attemptResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Quiz attempt not found"
            });
        }

        const attempt = attemptResult.rows[0];

        const answersResult = await pool.query(
            `
            SELECT
                qa.id,
                qa.question_id,
                q.question_text,
                q.question_type,
                q.points AS question_points,
                q.position,
                qa.selected_option_id,
                qa.answer_text,
                qa.is_correct,
                qa.points_earned
            FROM quiz_answers qa
            JOIN questions q
                ON qa.question_id = q.id
            WHERE qa.attempt_id = $1
            ORDER BY q.position ASC
            `,
            [attemptId]
        );

        const answers = answersResult.rows.map(answer => ({
            ...answer,
            question_points: Number(answer.question_points),
            points_earned: Number(answer.points_earned || 0)
        }));

        const totalPoints = answers.reduce(
            (total, answer) => total + answer.question_points,
            0
        );

        const earnedPoints = answers.reduce(
            (total, answer) => total + answer.points_earned,
            0
        );

        const correctAnswers = answers.filter(
            answer => answer.is_correct === true
        ).length;

        return res.json({
            success: true,
            attempt: {
                ...attempt,
                score: attempt.score === null
                    ? null
                    : Number(attempt.score)
            },
            result: {
                total_points: totalPoints,
                earned_points: earnedPoints,
                score: attempt.score === null
                    ? null
                    : Number(attempt.score),
                total_questions: answers.length,
                correct_answers: correctAnswers,
                incorrect_answers:
                    answers.length - correctAnswers
            },
            answers
        });
    } catch (error) {
        console.error("Get quiz attempt result error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching quiz result"
        });
    }
};

module.exports = {
    startQuizAttempt,
    getQuizAttempt,
    submitQuizAttempt,
    getStudentQuizHistory,
    getQuizAttemptResult
};