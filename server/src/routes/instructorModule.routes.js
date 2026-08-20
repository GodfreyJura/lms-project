
const express = require("express");

const {
    createInstructorModule,
    getInstructorModules,
    updateInstructorModule,
    deleteInstructorModule
} = require("../controllers/instructorModule.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.post(
    "/courses/:courseId/modules",
    authenticate,
    requireRole("INSTRUCTOR"),
    createInstructorModule
);

router.get(
    "/courses/:courseId/modules",
    authenticate,
    requireRole("INSTRUCTOR"),
    getInstructorModules
);

router.put(
    "/courses/:courseId/modules/:moduleId",
    authenticate,
    requireRole("INSTRUCTOR"),
    updateInstructorModule
);

router.delete(
    "/courses/:courseId/modules/:moduleId",
    authenticate,
    requireRole("INSTRUCTOR"),
    deleteInstructorModule
);

module.exports = router;

