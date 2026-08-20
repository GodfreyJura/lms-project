const express = require("express");

const {
    getAdminDashboard,
    getAdminInstructors,
    getAdminEnrollments
} = require("../controllers/admin.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.get(
    "/dashboard",
    authenticate,
    requireRole("ADMIN"),
    getAdminDashboard
);

router.get(
    "/instructors",
    authenticate,
    requireRole("ADMIN"),
    getAdminInstructors
);

router.get(
    "/enrollments",
    authenticate,
    requireRole("ADMIN"),
    getAdminEnrollments
);

module.exports = router;