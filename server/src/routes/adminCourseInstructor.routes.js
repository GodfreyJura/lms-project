const express = require("express");

const {
    getCourseInstructors,
    assignCourseInstructor,
    removeCourseInstructor
} = require("../controllers/adminCourseInstructor.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.get(
    "/:courseId/instructors",
    authenticate,
    requireRole("ADMIN"),
    getCourseInstructors
);

router.post(
    "/:courseId/instructors",
    authenticate,
    requireRole("ADMIN"),
    assignCourseInstructor
);

router.delete(
    "/:courseId/instructors/:instructorId",
    authenticate,
    requireRole("ADMIN"),
    removeCourseInstructor
);

module.exports = router;