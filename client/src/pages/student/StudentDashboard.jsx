import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  PlayCircle,
  TrendingUp,
  User,
  X,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import api from "../../services/api";

function StudentDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/student/dashboard");

        if (response.data.success) {
          setDashboard(response.data);
        } else {
          setError("Failed to load dashboard.");
        }
      } catch (err) {
        console.error("Dashboard error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load student dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-5" />

          <h2 className="text-xl font-semibold text-white">
            Loading your dashboard...
          </h2>

          <p className="text-slate-400 mt-2">
            Preparing your learning space
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
            <X className="text-red-400" size={28} />
          </div>

          <h2 className="text-xl font-bold text-white">
            Something went wrong
          </h2>

          <p className="text-slate-400 mt-3 mb-6">
            {error}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
            >
              Try Again
            </button>

            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const student = dashboard?.student;
  const statistics = dashboard?.statistics;
  const courses = dashboard?.courses || [];

  const firstName = student?.first_name || "Student";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-72
          bg-slate-900 border-r border-slate-800
          transform transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col">
          {/* LOGO */}
          <div className="px-6 py-7 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <GraduationCap size={24} />
              </div>

              <div>
                <h1 className="font-bold text-lg">
                  EduCore
                </h1>

                <p className="text-xs text-slate-500">
                  Learning Platform
                </p>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto lg:hidden text-slate-400 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 px-4 py-6">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 mb-3">
              Main Menu
            </p>

            <button
              onClick={() => navigate("/student")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/10"
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">
                Dashboard
              </span>
            </button>

            <button
              onClick={() => navigate("/student/courses/browse")}
              className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <BookOpen size={20} />
              <span>My Courses</span>
            </button>

            <button
  onClick={() => navigate("/student/quiz-history")}
  className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition"
>
  <TrendingUp size={20} />
  <span>My Progress</span>
</button>

            <button className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition">
              <User size={20} />
              <span>Profile</span>
            </button>
          </nav>

          {/* USER / LOGOUT */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                {firstName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="font-medium truncate">
                  {student?.first_name} {student?.last_name}
                </p>

                <p className="text-xs text-slate-500 truncate">
                  Student
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
            >
              <LogOut size={19} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="lg:ml-72 min-h-screen">
        {/* TOP BAR */}
        <header className="h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="h-full px-5 sm:px-8 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Menu size={25} />
            </button>

            <div className="hidden lg:block">
              <p className="text-sm text-slate-500">
                Student Portal
              </p>

              <p className="font-medium text-slate-200">
                Keep learning. Keep growing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">
                  {student?.first_name}{" "}
                  {student?.last_name}
                </p>

                <p className="text-xs text-slate-500">
                  {student?.email}
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                {firstName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE */}
        <div className="p-5 sm:p-8 lg:p-10 max-w-[1600px] mx-auto">
          {/* HERO */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-7 sm:p-10 mb-8 shadow-2xl shadow-blue-900/20">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

            <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <p className="text-blue-100 font-medium mb-2">
                Welcome back 👋
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Hello, {firstName}!
              </h1>

              <p className="text-blue-100 mt-4 text-base sm:text-lg leading-relaxed">
                Continue your learning journey and
                keep building your skills one lesson at
                a time.
              </p>

              {courses.length > 0 ? (
                <button
                  onClick={() =>
                    navigate(
                      `/student/courses/${courses[0].course_id}`
                    )
                  }
                  className="mt-7 inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-3 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg"
                >
                  <PlayCircle size={19} />
                  Continue Learning
                </button>
              ) : (
                <button
                  onClick={() => navigate("/student/courses/browse")}
                  className="mt-7 inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-3 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg"
                >
                  <BookOpen size={19} />
                  Browse Courses
                </button>
              )}
            </div>
          </section>

          {/* STATISTICS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
            <StatCard
              icon={<BookOpen size={22} />}
              value={statistics?.total_courses ?? 0}
              label="Total Courses"
              description="Courses enrolled"
              iconStyle="bg-blue-500/10 text-blue-400"
            />

            <StatCard
              icon={<CheckCircle2 size={22} />}
              value={statistics?.completed_courses ?? 0}
              label="Completed"
              description="Courses finished"
              iconStyle="bg-emerald-500/10 text-emerald-400"
            />

            <StatCard
              icon={<Clock3 size={22} />}
              value={statistics?.total_lessons ?? 0}
              label="Total Lessons"
              description="Lessons available"
              iconStyle="bg-purple-500/10 text-purple-400"
            />

            <StatCard
              icon={<TrendingUp size={22} />}
              value={`${statistics?.overall_progress_percentage ?? 0}%`}
              label="Overall Progress"
              description="Learning progress"
              iconStyle="bg-orange-500/10 text-orange-400"
            />
          </section>

          {/* COURSES HEADER */}
          <section className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold">
                My Courses
              </h2>

              <p className="text-slate-500 mt-1">
                Continue where you left off.
              </p>
            </div>

            <button
              onClick={() => navigate("/student/courses/browse")}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition"
            >
              <BookOpen size={17} />
              Browse All Courses
            </button>
          </section>

          {/* COURSES */}
          {courses.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-5">
                <BookOpen
                  size={30}
                  className="text-blue-400"
                />
              </div>

              <h3 className="text-xl font-semibold">
                No courses yet
              </h3>

              <p className="text-slate-500 mt-2">
                You are not enrolled in any courses yet.
              </p>

              <button
                onClick={() => navigate("/student/courses/browse")}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
              >
                <BookOpen size={18} />
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.course_id}
                  course={course}
                  onContinue={() =>
                    navigate(
                      `/student/courses/${course.course_id}`
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  value,
  label,
  description,
  iconStyle,
}) {
  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold tracking-tight">
            {value}
          </p>

          <p className="font-medium text-slate-200 mt-1">
            {label}
          </p>

          <p className="text-sm text-slate-500 mt-1">
            {description}
          </p>
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconStyle}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COURSE CARD
========================================================= */

function CourseCard({ course, onContinue }) {
  const progress = Number(
    course.progress_percentage || 0
  );

  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/5">
      {/* COURSE IMAGE AREA */}
      <div className="h-44 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_40%)]" />

        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen
            size={58}
            className="text-white/20 group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        <div className="absolute top-4 left-4">
          <span className="px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md text-white text-xs font-medium border border-white/10">
            Course
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6">
        <h3 className="text-xl font-bold line-clamp-2">
          {course.course_title}
        </h3>

        <p className="text-slate-500 mt-2 line-clamp-2 min-h-[48px]">
          {course.course_description ||
            "Continue learning and build your knowledge through this course."}
        </p>

        {/* LESSON COUNT */}
        <div className="flex items-center justify-between mt-5 text-sm">
          <span className="text-slate-400">
            {course.completed_lessons} of{" "}
            {course.total_lessons} lessons
          </span>

          <span className="font-semibold text-blue-400">
            {progress}%
          </span>
        </div>

        {/* PROGRESS */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(progress, 100)}%`,
            }}
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={onContinue}
          className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-600/10"
        >
          <PlayCircle size={19} />

          {progress > 0
            ? "Continue Learning"
            : "Start Course"}

          <ChevronRight
            size={18}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>
    </div>
  );
}

export default StudentDashboard;