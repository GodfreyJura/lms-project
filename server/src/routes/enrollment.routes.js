const express = require("express");

const {
    enrollInCourse,
    getMyEnrollments
} = require("../controllers/enrollment.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();


// Get courses enrolled by the authenticated student
router.get(
    "/my",
    authenticate,
    requireRole("STUDENT"),
    getMyEnrollments
);


// Enroll the authenticated student in a course
router.post(
    "/courses/:courseId/enroll",
    authenticate,
    requireRole("STUDENT"),
    enrollInCourse
);


module.exports = router;