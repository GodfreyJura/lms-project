
const express = require("express");

const {
    startLesson,
    completeLesson,
    getLessonProgress,
    getCourseProgress
} = require("../controllers/progress.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.post(
    "/lessons/:lessonId/start",
    authenticate,
    requireRole("STUDENT"),
    startLesson
);

router.patch(
    "/lessons/:lessonId/complete",
    authenticate,
    requireRole("STUDENT"),
    completeLesson
);

router.get(
    "/lessons/:lessonId",
    authenticate,
    requireRole("STUDENT"),
    getLessonProgress
);

router.get(
    "/courses/:courseId",
    authenticate,
    requireRole("STUDENT"),
    getCourseProgress
);

module.exports = router;

