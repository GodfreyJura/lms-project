
const express = require("express");

const {
    getInstructorAnalytics
} = require("../controllers/instructorAnalytics.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.get(
    "/analytics",
    authenticate,
    requireRole("INSTRUCTOR"),
    getInstructorAnalytics
);

module.exports = router;

