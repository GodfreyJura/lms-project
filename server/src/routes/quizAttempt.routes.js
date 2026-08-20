const express = require("express");

const {
    startQuizAttempt,
    getQuizAttempt,
    submitQuizAttempt,
    getStudentQuizHistory,
    getQuizAttemptResult
} = require("../controllers/quizAttempt.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.get(
    "/history",
    authenticate,
    requireRole("STUDENT"),
    getStudentQuizHistory
);

router.post(
    "/:quizId/start",
    authenticate,
    requireRole("STUDENT"),
    startQuizAttempt
);

router.get(
    "/attempts/:attemptId",
    authenticate,
    requireRole("STUDENT"),
    getQuizAttempt
);

router.get(
    "/attempts/:attemptId/result",
    authenticate,
    requireRole("STUDENT"),
    getQuizAttemptResult
);

router.post(
    "/attempts/:attemptId/submit",
    authenticate,
    requireRole("STUDENT"),
    submitQuizAttempt
);

module.exports = router;