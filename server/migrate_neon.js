require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const runMigrations = async () => {
  try {
    console.log("Starting migrations...");

    // Enable pgcrypto for gen_random_uuid
    await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    console.log("✅ pgcrypto extension");

    // 1. institutions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS institutions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ institutions table");

    // 2. roles
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ roles table");

    // 3. users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(institution_id, email)
      )
    `);
    console.log("✅ users table");

    // 4. courses
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT,
        thumbnail_url TEXT,
        level VARCHAR(50),
        status VARCHAR(20) DEFAULT 'DRAFT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(institution_id, slug)
      )
    `);
    console.log("✅ courses table");

    // 5. modules
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        position INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ modules table");

    // 6. lessons
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        video_url TEXT,
        duration_minutes INTEGER,
        position INTEGER NOT NULL DEFAULT 1,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ lessons table");

    // 7. course_instructors
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_instructors (
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (course_id, instructor_id)
      )
    `);
    console.log("✅ course_instructors table");

    // 8. enrollments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        UNIQUE(student_id, course_id)
      )
    `);
    console.log("✅ enrollments table");

    // 9. lesson_progress
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, lesson_id)
      )
    `);
    console.log("✅ lesson_progress table");

    // 10. quizzes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        time_limit_minutes INTEGER,
        max_attempts INTEGER DEFAULT 1,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ quizzes table");

    // 11. questions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) DEFAULT 'MULTIPLE_CHOICE',
        points INTEGER DEFAULT 1,
        position INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ questions table");

    // 12. question_options
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_options (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT FALSE,
        position INTEGER NOT NULL DEFAULT 1
      )
    `);
    console.log("✅ question_options table");

    // 13. quiz_attempts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        attempt_number INTEGER DEFAULT 1,
        score DECIMAL(5,2),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP
      )
    `);
    console.log("✅ quiz_attempts table");

    // 14. quiz_answers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_answers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
        answer_text TEXT,
        is_correct BOOLEAN DEFAULT FALSE,
        points_earned DECIMAL(5,2) DEFAULT 0
      )
    `);
    console.log("✅ quiz_answers table");

    // 15. login_attempts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ login_attempts table");

    // 16. audit_logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_role VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100),
        resource_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ audit_logs table");

    // 17. notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ notifications table");

    console.log("\n🎉 All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error.message);
    process.exit(1);
  }
};

runMigrations();