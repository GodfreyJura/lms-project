const express = require("express");

const {
    createQuiz,
    getCourseQuizzes,
    getPublishedCourseQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz
} = require("../controllers/quiz.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

/**
 * STUDENT: Get published quizzes for a course
 */
router.get(
    "/courses/:courseId/published",
    authenticate,
    requireRole("STUDENT"),
    getPublishedCourseQuizzes
);

/**
 * COURSE QUIZZES (Admin/Instructor)
 */
router.get(
    "/courses/:courseId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    getCourseQuizzes
);

/**
 * CREATE QUIZ
 */
router.post(
    "/courses/:courseId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    createQuiz
);

/**
 * GET QUIZ
 */
router.get(
    "/:quizId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    getQuizById
);

/**
 * UPDATE QUIZ
 */
router.put(
    "/:quizId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    updateQuiz
);

/**
 * DELETE QUIZ
 */
router.delete(
    "/:quizId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    deleteQuiz
);

module.exports = router;