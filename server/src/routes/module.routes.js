const express = require("express");

const {
    createModule,
    getCourseModules,
    getModuleById,
    updateModule,
    deleteModule
} = require("../controllers/module.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();


// Get all modules for a course
router.get(
    "/courses/:courseId/modules",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    getCourseModules
);


// Create module
router.post(
    "/courses/:courseId/modules",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    createModule
);


// Get one module
router.get(
    "/:moduleId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    getModuleById
);


// Update module
router.put(
    "/:moduleId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    updateModule
);


// Delete module
router.delete(
    "/:moduleId",
    authenticate,
    requireRole("ADMIN", "INSTRUCTOR"),
    deleteModule
);


module.exports = router;