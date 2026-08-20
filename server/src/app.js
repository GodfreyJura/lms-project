const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const pool = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const enrollmentRoutes = require("./routes/enrollment.routes");
const moduleRoutes = require("./routes/module.routes");
const lessonRoutes = require("./routes/lesson.routes");
const progressRoutes = require("./routes/progress.routes");
const studentRoutes = require("./routes/student.routes");

const instructorRoutes = require("./routes/instructor.routes");
const instructorModuleRoutes = require("./routes/instructorModule.routes");
const instructorLessonRoutes = require("./routes/instructorLesson.routes");
const instructorStudentRoutes = require("./routes/instructorStudent.routes");
const instructorAnalyticsRoutes = require("./routes/instructorAnalytics.routes");

const adminRoutes = require("./routes/admin.routes");
const adminUserRoutes = require("./routes/adminUser.routes");
const adminCourseRoutes = require("./routes/adminCourse.routes");
const adminCourseInstructorRoutes = require("./routes/adminCourseInstructor.routes");
const adminCourseModuleRoutes = require("./routes/adminCourseModule.routes");

const quizRoutes = require("./routes/quiz.routes");
const questionRoutes = require("./routes/question.routes");
const quizAttemptRoutes = require("./routes/quizAttempt.routes");

const app = express();

// SECURITY HEADERS
app.use(helmet());

// CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// BODY PARSER
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// GENERAL API RATE LIMIT
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per window
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use("/api", apiLimiter);

// AUTH RATE LIMIT (stricter for login/register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per window
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use("/api/auth", authLimiter);

// HEALTH CHECK
app.get("/api/health", (req, res) => {
    return res.json({
        success: true,
        message: "LMS API is running",
        timestamp: new Date().toISOString()
    });
});

// TEST DB
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        return res.json({
            success: true,
            message: "Database connection successful",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection failed:", error);

        return res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// ROUTES
app.use("/api/auth", authRoutes);

app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/student", studentRoutes);

app.use("/api/instructor", instructorRoutes);
app.use("/api/instructor", instructorModuleRoutes);
app.use("/api/instructor", instructorLessonRoutes);
app.use("/api/instructor", instructorStudentRoutes);
app.use("/api/instructor", instructorAnalyticsRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/api/admin/courses", adminCourseInstructorRoutes);
app.use("/api/admin/courses", adminCourseModuleRoutes);

app.use("/api/quiz-attempts", quizAttemptRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/questions", questionRoutes);

// 404 HANDLER
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// ERROR HANDLER
app.use((err, req, res, next) => {
    console.error("Server error:", err);

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`LMS server running on port ${PORT}`);
});