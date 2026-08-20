const express = require("express");

const {
    getStudentDashboard,
    getStudentCourseDetails,
    getPublishedCourses
} = require("../controllers/student.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.get(
    "/dashboard",
    authenticate,
    requireRole("STUDENT"),
    getStudentDashboard
);

router.get(
    "/courses/browse",
    authenticate,
    requireRole("STUDENT"),
    getPublishedCourses
);

router.get(
    "/courses/:courseId",
    authenticate,
    requireRole("STUDENT"),
    getStudentCourseDetails
);

module.exports = router;