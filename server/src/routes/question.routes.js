const express = require("express");

const {
    createQuestion,
    getQuizQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    createOption,
    updateOption,
    deleteOption
} = require("../controllers/question.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

/**
 * QUIZ QUESTIONS
 */
router.get(
    "/quizzes/:quizId/questions",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    getQuizQuestions
);

router.post(
    "/quizzes/:quizId/questions",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    createQuestion
);

/**
 * SINGLE QUESTION
 */
router.get(
    "/:questionId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    getQuestionById
);

router.put(
    "/:questionId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    updateQuestion
);

router.delete(
    "/:questionId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    deleteQuestion
);

/**
 * OPTIONS
 */
router.post(
    "/:questionId/options",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    createOption
);

router.put(
    "/options/:optionId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    updateOption
);

router.delete(
    "/options/:optionId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    deleteOption
);

module.exports = router;
