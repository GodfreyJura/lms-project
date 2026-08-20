import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import StudentDashboard from "../pages/student/StudentDashboard";
import StudentCourses from "../pages/student/StudentCourses";
import StudentCourse from "../pages/student/StudentCourse";
import StudentQuiz from "../pages/student/StudentQuiz";
import StudentQuizResult from "../pages/student/StudentQuizResult";
import StudentQuizHistory from "../pages/student/StudentQuizHistory";

import InstructorDashboard from "../pages/instructor/InstructorDashboard";
import InstructorCourse from "../pages/instructor/InstructorCourse";
import InstructorAnalytics from "../pages/instructor/InstructorAnalytics";
import InstructorQuizList from "../pages/instructor/InstructorQuizList";
import InstructorQuizCreate from "../pages/instructor/InstructorQuizCreate";
import InstructorQuizDetails from "../pages/instructor/InstructorQuizDetails";
import InstructorAddQuestion from "../pages/instructor/InstructorAddQuestion";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminUserCreate from "../pages/admin/AdminUserCreate";
import AdminUserEdit from "../pages/admin/AdminUserEdit";
import AdminCourses from "../pages/admin/AdminCourses";
import AdminCourseCreate from "../pages/admin/AdminCourseCreate";
import AdminCourseEdit from "../pages/admin/AdminCourseEdit";
import AdminCourseDetails from "../pages/admin/AdminCourseDetails";
import AdminCourseInstructors from "../pages/admin/AdminCourseInstructors";
import AdminInstructors from "../pages/admin/AdminInstructors";
import AdminEnrollments from "../pages/admin/AdminEnrollments";
import AdminSettings from "../pages/admin/AdminSettings";
import AdminAuditLogs from "../pages/admin/AdminAuditLogs";

import AdminLayout from "../components/admin/AdminLayout";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses/browse"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses/:courseId"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentCourse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz/:quizId"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentQuiz />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz-result/:attemptId"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentQuizResult />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz-history"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentQuizHistory />
          </ProtectedRoute>
        }
      />

      {/* Instructor routes */}
      <Route
        path="/instructor"
        element={
          <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
            <InstructorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId"
        element={
          <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
            <InstructorCourse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/analytics"
        element={
          <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
            <InstructorAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId/quizzes"
        element={
          <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
            <InstructorQuizList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId/quizzes/create"
        element={
          <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
            <InstructorQuizCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId/quizzes/:quizId"
        element={
          <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
            <InstructorQuizDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId/quizzes/:quizId/add-question"
        element={
          <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
            <InstructorAddQuestion />
          </ProtectedRoute>
        }
      />

      {/* Admin routes - All nested under AdminLayout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        
        {/* User routes */}
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/create" element={<AdminUserCreate />} />
        <Route path="users/:userId/edit" element={<AdminUserEdit />} />
        
        {/* Course routes */}
        <Route path="courses" element={<AdminCourses />} />
        <Route path="courses/create" element={<AdminCourseCreate />} />
        <Route path="courses/:courseId/edit" element={<AdminCourseEdit />} />
        <Route path="courses/:courseId/instructors" element={<AdminCourseInstructors />} />
        <Route path="courses/:courseId" element={<AdminCourseDetails />} />
        
        {/* Other admin routes */}
        <Route path="instructors" element={<AdminInstructors />} />
        <Route path="enrollments" element={<AdminEnrollments />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;