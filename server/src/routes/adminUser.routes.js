const express = require("express");

const {
    getAdminUsers,
    getAdminUserById,
    createAdminUser,
    updateAdminUser,
    deactivateAdminUser,
    reactivateAdminUser
} = require("../controllers/adminUser.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.get(
    "/",
    authenticate,
    requireRole("ADMIN"),
    getAdminUsers
);

router.get(
    "/:userId",
    authenticate,
    requireRole("ADMIN"),
    getAdminUserById
);

router.post(
    "/",
    authenticate,
    requireRole("ADMIN"),
    createAdminUser
);

router.put(
    "/:userId",
    authenticate,
    requireRole("ADMIN"),
    updateAdminUser
);

router.delete(
    "/:userId",
    authenticate,
    requireRole("ADMIN"),
    deactivateAdminUser
);

router.patch(
    "/:userId/reactivate",
    authenticate,
    requireRole("ADMIN"),
    reactivateAdminUser
);

module.exports = router;