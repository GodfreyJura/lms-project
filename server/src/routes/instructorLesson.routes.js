
const express = require("express");

const {
    createInstructorLesson,
    getInstructorLessons,
    updateInstructorLesson,
    deleteInstructorLesson,
    toggleLessonPublication
} = require("../controllers/instructorLesson.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.post(
    "/modules/:moduleId/lessons",
    authenticate,
    requireRole("INSTRUCTOR"),
    createInstructorLesson
);

router.get(
    "/modules/:moduleId/lessons",
    authenticate,
    requireRole("INSTRUCTOR"),
    getInstructorLessons
);

router.put(
    "/modules/:moduleId/lessons/:lessonId",
    authenticate,
    requireRole("INSTRUCTOR"),
    updateInstructorLesson
);

router.delete(
    "/modules/:moduleId/lessons/:lessonId",
    authenticate,
    requireRole("INSTRUCTOR"),
    deleteInstructorLesson
);

router.patch(
    "/modules/:moduleId/lessons/:lessonId/publish",
    authenticate,
    requireRole("INSTRUCTOR"),
    toggleLessonPublication
);

module.exports = router;

