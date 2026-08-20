const express = require("express");
const { register, login } = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authenticate, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

router.get(
    "/admin-test",
    authenticate,
    requireRole("ADMIN"),
    (req, res) => {
        res.json({
            success: true,
            message: "Admin access granted",
            user: req.user
        });
    }
);

module.exports = router;