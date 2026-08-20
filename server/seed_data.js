const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_9P4wucYXlLAj@ep-restless-king-ax87dp46.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

const seedData = async () => {
  try {
    console.log("Starting seed...");

    // 1. Create Institution
    const institutionResult = await pool.query(
      `INSERT INTO institutions (name, slug)
       VALUES ('LMS Institution', 'lms-institution')
       ON CONFLICT (slug) DO NOTHING
       RETURNING id, name, slug`
    );

    let institutionId;

    if (institutionResult.rows.length > 0) {
      institutionId = institutionResult.rows[0].id;
      console.log("✅ Institution created");
    } else {
      const existing = await pool.query(
        `SELECT id FROM institutions WHERE slug = 'lms-institution'`
      );
      institutionId = existing.rows[0].id;
      console.log("✅ Institution already exists");
    }

    // 2. Create Roles
    const roles = [
      { name: "STUDENT", description: "Learner account" },
      { name: "INSTRUCTOR", description: "Teaching account" },
      { name: "ADMIN", description: "Administrative account" }
    ];

    const roleIds = {};

    for (const role of roles) {
      const result = await pool.query(
        `INSERT INTO roles (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING
         RETURNING id, name`,
        [role.name, role.description]
      );

      if (result.rows.length > 0) {
        roleIds[role.name] = result.rows[0].id;
      } else {
        const existing = await pool.query(
          `SELECT id FROM roles WHERE name = $1`,
          [role.name]
        );
        roleIds[role.name] = existing.rows[0].id;
      }
    }
    console.log("✅ Roles created");

    // 3. Create Admin User
    const adminPassword = await bcrypt.hash("Admin@123", 12);

    const adminResult = await pool.query(
      `INSERT INTO users (
        institution_id, role_id, first_name, last_name,
        email, password_hash, is_active, email_verified
      )
      VALUES ($1, $2, 'Admin', 'User', 'admin@lms.com', $3, TRUE, TRUE)
      ON CONFLICT (institution_id, email) DO NOTHING
      RETURNING id, email`,
      [institutionId, roleIds["ADMIN"], adminPassword]
    );

    if (adminResult.rows.length > 0) {
      console.log("✅ Admin created: admin@lms.com / Admin@123");
    } else {
      console.log("✅ Admin already exists");
    }

    // 4. Create Instructor User
    const instructorPassword = await bcrypt.hash("Instructor@123", 12);

    const instructorResult = await pool.query(
      `INSERT INTO users (
        institution_id, role_id, first_name, last_name,
        email, password_hash, is_active, email_verified
      )
      VALUES ($1, $2, 'Jared', 'Junior', 'jared@instructor.com', $3, TRUE, TRUE)
      ON CONFLICT (institution_id, email) DO NOTHING
      RETURNING id, email`,
      [institutionId, roleIds["INSTRUCTOR"], instructorPassword]
    );

    let instructorId;

    if (instructorResult.rows.length > 0) {
      instructorId = instructorResult.rows[0].id;
      console.log("✅ Instructor created: jared@instructor.com / Instructor@123");
    } else {
      const existing = await pool.query(
        `SELECT id FROM users WHERE email = 'jared@instructor.com'`
      );
      instructorId = existing.rows[0].id;
      console.log("✅ Instructor already exists");
    }

    // 5. Create Student User
    const studentPassword = await bcrypt.hash("Student@123", 12);

    const studentResult = await pool.query(
      `INSERT INTO users (
        institution_id, role_id, first_name, last_name,
        email, password_hash, is_active, email_verified
      )
      VALUES ($1, $2, 'Nancy', 'Waweru', 'nancy@student.com', $3, TRUE, TRUE)
      ON CONFLICT (institution_id, email) DO NOTHING
      RETURNING id, email`,
      [institutionId, roleIds["STUDENT"], studentPassword]
    );

    let studentId;

    if (studentResult.rows.length > 0) {
      studentId = studentResult.rows[0].id;
      console.log("✅ Student created: nancy@student.com / Student@123");
    } else {
      const existing = await pool.query(
        `SELECT id FROM users WHERE email = 'nancy@student.com'`
      );
      studentId = existing.rows[0].id;
      console.log("✅ Student already exists");
    }

    // 6. Create Sample Course
    const courseResult = await pool.query(
      `INSERT INTO courses (
        institution_id, title, slug, description, level, status
      )
      VALUES (
        $1, 'Introduction to Web Development',
        'introduction-to-web-development',
        'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
        'BEGINNER', 'PUBLISHED'
      )
      ON CONFLICT (institution_id, slug) DO NOTHING
      RETURNING id, title`,
      [institutionId]
    );

    let courseId;

    if (courseResult.rows.length > 0) {
      courseId = courseResult.rows[0].id;
      console.log("✅ Course created");
    } else {
      const existing = await pool.query(
        `SELECT id FROM courses WHERE slug = 'introduction-to-web-development' AND institution_id = $1`,
        [institutionId]
      );
      courseId = existing.rows[0].id;
      console.log("✅ Course already exists");
    }

    // 7. Assign Instructor to Course
    await pool.query(
      `INSERT INTO course_instructors (course_id, instructor_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [courseId, instructorId]
    );
    console.log("✅ Instructor assigned to course");

    // 8. Enroll Student in Course
    await pool.query(
      `INSERT INTO enrollments (student_id, course_id, status)
       VALUES ($1, $2, 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [studentId, courseId]
    );
    console.log("✅ Student enrolled in course");

    // 9. Create Sample Module
    const moduleResult = await pool.query(
      `INSERT INTO modules (course_id, title, description, position)
       VALUES ($1, 'HTML Basics', 'Learn the fundamentals of HTML', 1)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [courseId]
    );

    let moduleId;

    if (moduleResult.rows.length > 0) {
      moduleId = moduleResult.rows[0].id;
    } else {
      const existing = await pool.query(
        `SELECT id FROM modules WHERE course_id = $1 AND position = 1`
      );
      moduleId = existing.rows[0].id;
    }
    console.log("✅ Module created");

    // 10. Create Sample Lesson
    await pool.query(
      `INSERT INTO lessons (
        module_id, title, content, video_url,
        duration_minutes, position, is_published
      )
      VALUES (
        $1, 'What is HTML?',
        'HTML (HyperText Markup Language) is the standard markup language for creating web pages.',
        'https://www.youtube.com/watch?v=salY_Sm6mv4',
        15, 1, TRUE
      )
      ON CONFLICT DO NOTHING`,
      [moduleId]
    );
    console.log("✅ Lesson created");

    console.log("\n🎉 Seed data completed successfully!");
    console.log("\n--- LOGIN CREDENTIALS ---");
    console.log("Admin: admin@lms.com / Admin@123");
    console.log("Instructor: jared@instructor.com / Instructor@123");
    console.log("Student: nancy@student.com / Student@123");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seedData();