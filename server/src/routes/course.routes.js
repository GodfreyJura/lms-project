
const express = require("express");

const {
    createCourse,
    getCourses,
    getCourseById
} = require("../controllers/course.controller");

const {
    assignInstructor
} = require("../controllers/courseInstructor.controller");

const {
    publishCourse
} = require("../controllers/coursePublish.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| GET ALL COURSES
|--------------------------------------------------------------------------
*/
router.get(
    "/",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR", "STUDENT"),
    getCourses
);


/*
|--------------------------------------------------------------------------
| GET COURSE BY ID
|--------------------------------------------------------------------------
*/
router.get(
    "/:courseId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR", "STUDENT"),
    getCourseById
);


/*
|--------------------------------------------------------------------------
| CREATE COURSE
|--------------------------------------------------------------------------
*/
router.post(
    "/",
    authenticate,
    requireRole("ADMIN"),
    createCourse
);


/*
|--------------------------------------------------------------------------
| ASSIGN INSTRUCTOR
|--------------------------------------------------------------------------
*/
router.post(
    "/:courseId/instructors",
    authenticate,
    requireRole("ADMIN"),
    assignInstructor
);


/*
|--------------------------------------------------------------------------
| PUBLISH COURSE
|--------------------------------------------------------------------------
*/
router.patch(
    "/:courseId/publish",
    authenticate,
    requireRole("ADMIN"),
    publishCourse
);


module.exports = router;

