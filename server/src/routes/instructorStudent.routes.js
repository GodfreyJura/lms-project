
const express = require("express");

const {
    getInstructorStudents,
    getInstructorStudentDetails
} = require("../controllers/instructorStudent.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.get(
    "/students",
    authenticate,
    requireRole("INSTRUCTOR"),
    getInstructorStudents
);

router.get(
    "/students/:studentId",
    authenticate,
    requireRole("INSTRUCTOR"),
    getInstructorStudentDetails
);

module.exports = router;

