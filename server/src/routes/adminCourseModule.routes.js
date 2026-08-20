const express = require("express");

const {
    getAdminCourseModules,
    getAdminCourseModuleById,
    createAdminCourseModule,
    updateAdminCourseModule,
    deleteAdminCourseModule
} = require("../controllers/adminCourseModule.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.get(
    "/:courseId/modules",
    authenticate,
    requireRole("ADMIN"),
    getAdminCourseModules
);

router.get(
    "/:courseId/modules/:moduleId",
    authenticate,
    requireRole("ADMIN"),
    getAdminCourseModuleById
);

router.post(
    "/:courseId/modules",
    authenticate,
    requireRole("ADMIN"),
    createAdminCourseModule
);

router.put(
    "/:courseId/modules/:moduleId",
    authenticate,
    requireRole("ADMIN"),
    updateAdminCourseModule
);

router.delete(
    "/:courseId/modules/:moduleId",
    authenticate,
    requireRole("ADMIN"),
    deleteAdminCourseModule
);

module.exports = router;