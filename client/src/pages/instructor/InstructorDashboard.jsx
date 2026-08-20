import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  Layers3,
  FileText,
  Rocket,
  BarChart3,
  LogOut,
  ArrowRight,
  Plus,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock3,
  Menu,
  X,
} from "lucide-react";
import api from "../../services/api";

function InstructorDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        const response = await api.get("/instructor/dashboard");

        if (response.data.success) {
          setDashboard(response.data);
        } else {
          setError("Unable to load instructor dashboard.");
        }
      } catch (err) {
        console.error("Instructor dashboard error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (err.response?.status === 403) {
          setError("You do not have instructor access.");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load instructor dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />

            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          </div>

          <h2 className="text-xl font-semibold">
            Loading your instructor dashboard
          </h2>

          <p className="text-slate-500 mt-2">
            Preparing your teaching workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-900/50 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-5">
            <X size={28} />
          </div>

          <h2 className="text-2xl font-bold mb-3">
            Unable to load dashboard
          </h2>

          <p className="text-red-400 mb-7">
            {error}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
            >
              Try Again
            </button>

            <button
              onClick={handleLogout}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const instructor = dashboard?.instructor;
  const statistics = dashboard?.statistics;
  const courses = dashboard?.courses || [];

  const firstName = instructor?.first_name || "Instructor";
  const lastName = instructor?.last_name || "";

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* BACKGROUND GLOW */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute top-[40%] -left-40 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* LOGO */}

          <button
            onClick={() => navigate("/instructor")}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <GraduationCap size={20} />
            </div>

            <div className="hidden sm:block text-left">
              <p className="font-bold leading-none">
                LMS
              </p>

              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                Instructor
              </p>
            </div>
          </button>

          {/* DESKTOP NAV */}

          <div className="hidden md:flex items-center gap-2">

            <button
              onClick={() => navigate("/instructor")}
              className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium"
            >
              Dashboard
            </button>

            <button
              onClick={() => navigate("/instructor/analytics")}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm font-medium flex items-center gap-2"
            >
              <BarChart3 size={16} />
              Analytics
            </button>

          </div>

          {/* PROFILE */}

          <div className="hidden sm:flex items-center gap-4">

            <div className="text-right">
              <p className="text-sm font-semibold">
                {firstName} {lastName}
              </p>

              <p className="text-xs text-slate-500">
                Instructor
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>

          </div>

          {/* MOBILE */}

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2.5 rounded-xl hover:bg-slate-800"
          >
            <Menu size={21} />
          </button>

        </div>

      </header>

      {/* MOBILE MENU */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl md:hidden">

          <div className="p-5">

            <div className="flex items-center justify-between mb-10">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <GraduationCap size={21} />
                </div>

                <span className="font-bold text-lg">
                  Instructor Portal
                </span>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-800"
              >
                <X size={22} />
              </button>

            </div>

            <div className="space-y-2">

              <button
                onClick={() => {
                  navigate("/instructor");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-4 rounded-xl bg-blue-600/10 text-blue-400 font-semibold"
              >
                Dashboard
              </button>

              <button
                onClick={() => {
                  navigate("/instructor/analytics");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-4 rounded-xl text-slate-300 hover:bg-slate-800 flex items-center gap-3"
              >
                <BarChart3 size={19} />
                Analytics
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-4 rounded-xl text-red-400 hover:bg-red-950/30 flex items-center gap-3"
              >
                <LogOut size={19} />
                Logout
              </button>

            </div>

          </div>
        </div>
      )}

      {/* MAIN */}

      <main className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-8 lg:py-10">

        {/* HERO */}

        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/60 via-slate-900 to-purple-950/40 p-7 sm:p-10 mb-10">

          <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative">

            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
              <Sparkles size={16} />
              INSTRUCTOR WORKSPACE
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">

              <div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  Welcome back,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                    {firstName}
                  </span>
                </h1>

                <p className="text-slate-400 text-base sm:text-lg mt-4 max-w-2xl leading-relaxed">
                  Manage your courses, monitor your students,
                  and continue building an exceptional learning
                  experience.
                </p>

              </div>

              <button
                onClick={() => navigate("/instructor/analytics")}
                className="w-fit flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-200 font-semibold transition"
              >
                <BarChart3 size={18} />
                View Analytics
              </button>

            </div>

          </div>
        </section>

        {/* STATISTICS */}

        <section className="mb-10">

          <div className="flex items-end justify-between mb-5">

            <div>
              <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                Overview
              </p>

              <h2 className="text-2xl font-bold mt-1">
                Teaching Statistics
              </h2>
            </div>

          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

            <StatCard
              label="Total Courses"
              value={statistics?.total_courses ?? 0}
              icon={BookOpen}
              accent="blue"
            />

            <StatCard
              label="Published"
              value={statistics?.published_courses ?? 0}
              icon={Rocket}
              accent="emerald"
            />

            <StatCard
              label="Students"
              value={statistics?.total_students ?? 0}
              icon={Users}
              accent="purple"
            />

            <StatCard
              label="Modules"
              value={statistics?.total_modules ?? 0}
              icon={Layers3}
              accent="amber"
            />

            <StatCard
              label="Lessons"
              value={statistics?.total_lessons ?? 0}
              icon={FileText}
              accent="cyan"
            />

          </div>

        </section>

        {/* COURSES */}

        <section>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">

            <div>

              <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                Your Workspace
              </p>

              <h2 className="text-2xl font-bold mt-1">
                My Courses
              </h2>

              <p className="text-slate-500 mt-1">
                Manage and monitor the courses assigned to you.
              </p>

            </div>

            <button
              onClick={() => navigate("/instructor/analytics")}
              className="w-fit flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition text-sm font-medium"
            >
              <BarChart3 size={16} />
              Analytics
            </button>

          </div>

          {courses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">

              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-5">
                <BookOpen size={30} />
              </div>

              <h3 className="text-xl font-bold">
                No courses assigned
              </h3>

              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                You currently don't have any courses assigned
                to your instructor account.
              </p>

            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

              {courses.map((course) => (
                <CourseCard
                  key={course.course_id}
                  course={course}
                  onManage={() =>
                    navigate(
                      `/instructor/courses/${course.course_id}`
                    )
                  }
                />
              ))}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}) {
  const accentStyles = {
    blue: "bg-blue-500/10 text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    purple: "bg-purple-500/10 text-purple-400",
    amber: "bg-amber-500/10 text-amber-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
  };

  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300">

      <div className="flex items-start justify-between">

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            accentStyles[accent]
          }`}
        >
          <Icon size={21} />
        </div>

        <ArrowRight
          size={16}
          className="text-slate-700 group-hover:text-slate-400 transition"
        />

      </div>

      <p className="text-sm text-slate-500 mt-5">
        {label}
      </p>

      <p className="text-3xl font-bold mt-1">
        {value}
      </p>

    </div>
  );
}


/* ============================================================
   COURSE CARD
============================================================ */

function CourseCard({ course, onManage }) {
  const isPublished = course.status === "PUBLISHED";

  return (
    <article className="group rounded-3xl border border-slate-800 bg-slate-900/70 overflow-hidden hover:border-slate-700 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/10">

      {/* CARD HEADER */}

      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950">

        <div className="absolute -right-8 -top-12 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="absolute left-6 bottom-5 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
          <BookOpen size={22} className="text-blue-300" />
        </div>

        <div className="absolute top-5 right-5">

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              isPublished
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {isPublished ? (
              <CheckCircle2 size={13} />
            ) : (
              <Clock3 size={13} />
            )}

            {course.status}
          </span>

        </div>

      </div>

      {/* BODY */}

      <div className="p-6">

        <div className="flex items-start justify-between gap-3">

          <div>

            <h3 className="text-lg font-bold leading-snug group-hover:text-blue-400 transition">
              {course.course_title}
            </h3>

            {course.level && (
              <span className="inline-block mt-2 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs">
                {course.level}
              </span>
            )}

          </div>

        </div>

        <p className="text-sm text-slate-500 leading-relaxed mt-4 line-clamp-3">
          {course.description ||
            "No course description available."}
        </p>

        {/* METRICS */}

        <div className="grid grid-cols-4 border-y border-slate-800 mt-6 py-4">

          <CourseMetric
            icon={Users}
            label="Students"
            value={course.total_students}
          />

          <CourseMetric
            icon={Layers3}
            label="Modules"
            value={course.total_modules}
          />

          <CourseMetric
            icon={FileText}
            label="Lessons"
            value={course.total_lessons}
          />

          <CourseMetric
            icon={Rocket}
            label="Live"
            value={course.published_lessons}
          />

        </div>

        {/* MANAGE */}

        <button
          onClick={onManage}
          className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-900/20"
        >
          Manage Course
          <ArrowRight size={17} />
        </button>

      </div>

    </article>
  );
}


/* ============================================================
   COURSE METRIC
============================================================ */

function CourseMetric({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="text-center min-w-0">

      <Icon
        size={14}
        className="mx-auto text-slate-600 mb-1"
      />

      <p className="text-sm font-bold">
        {value ?? 0}
      </p>

      <p className="text-[10px] text-slate-600 truncate">
        {label}
      </p>

    </div>
  );
}

export default InstructorDashboard;