
const express = require("express");

const {
    createLesson,
    publishLesson,
    getPublishedLessons,
    getStudentLesson
} = require("../controllers/lesson.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.post(
    "/modules/:moduleId/lessons",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    createLesson
);

router.patch(
    "/:lessonId/publish",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    publishLesson
);

router.get(
    "/modules/:moduleId",
    authenticate,
    requireRole("STUDENT"),
    getPublishedLessons
);

router.get(
    "/:lessonId",
    authenticate,
    requireRole("STUDENT"),
    getStudentLesson
);

module.exports = router;
