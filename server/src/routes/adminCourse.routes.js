const express = require("express");

const {
    getAdminCourses,
    getAdminCourseById,
    createAdminCourse,
    updateAdminCourse,
    deleteAdminCourse
} = require("../controllers/adminCourse.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.get(
    "/",
    authenticate,
    requireRole("ADMIN"),
    getAdminCourses
);

router.get(
    "/:courseId",
    authenticate,
    requireRole("ADMIN"),
    getAdminCourseById
);

router.post(
    "/",
    authenticate,
    requireRole("ADMIN"),
    createAdminCourse
);

router.put(
    "/:courseId",
    authenticate,
    requireRole("ADMIN"),
    updateAdminCourse
);

router.delete(
    "/:courseId",
    authenticate,
    requireRole("ADMIN"),
    deleteAdminCourse
);

module.exports = router;