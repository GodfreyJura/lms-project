
const express = require("express");

const {
    getInstructorDashboard,
    getInstructorCourses,
    getInstructorCourseById
} = require("../controllers/instructor.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| INSTRUCTOR DASHBOARD
|--------------------------------------------------------------------------
*/
router.get(
    "/dashboard",
    authenticate,
    requireRole("INSTRUCTOR"),
    getInstructorDashboard
);


/*
|--------------------------------------------------------------------------
| INSTRUCTOR COURSES
|--------------------------------------------------------------------------
*/
router.get(
    "/courses",
    authenticate,
    requireRole("INSTRUCTOR"),
    getInstructorCourses
);


/*
|--------------------------------------------------------------------------
| INSTRUCTOR COURSE DETAILS
|--------------------------------------------------------------------------
*/
router.get(
    "/courses/:courseId",
    authenticate,
    requireRole("INSTRUCTOR"),
    getInstructorCourseById
);


module.exports = router;

