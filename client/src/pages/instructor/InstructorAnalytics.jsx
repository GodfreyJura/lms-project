import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  LogOut,
  Users,
  FileText,
  Rocket,
  TrendingUp,
} from "lucide-react";
import api from "../../services/api";

function InstructorAnalytics() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/instructor/analytics");

      if (response.data.success) {
        setAnalytics(response.data);
      } else {
        setError(
          response.data.message || "Unable to load instructor analytics."
        );
      }
    } catch (err) {
      console.error("Instructor analytics error:", err);

      if (err.response?.status === 401) {
        logout();
        return;
      }

      if (err.response?.status === 403) {
        setError("You do not have instructor access.");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load instructor analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-6 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
          <h2 className="text-xl font-bold">
            Loading analytics...
          </h2>
          <p className="text-slate-500 mt-2">
            Preparing your teaching analytics.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-red-900/50 bg-slate-900 p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <BarChart3 size={28} />
          </div>

          <h2 className="text-2xl font-bold">
            Unable to load analytics
          </h2>

          <p className="text-red-400 mt-3">
            {error}
          </p>

          <div className="flex justify-center gap-3 mt-7">
            <button
              onClick={loadAnalytics}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
            >
              Try Again
            </button>

            <button
              onClick={() => navigate("/instructor")}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold transition"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const instructor = analytics?.instructor || {};
  const overview = analytics?.overview || {};
  const learning = analytics?.learning || {};
  const courses = analytics?.courses || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/instructor")}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
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

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold">
                {instructor.first_name} {instructor.last_name}
              </p>

              <p className="text-xs text-slate-500">
                Instructor
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
              {(instructor.first_name || "I").charAt(0)}
              {(instructor.last_name || "").charAt(0)}
            </div>

            <button
              onClick={logout}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute top-[45%] -left-40 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl" />
        </div>

        <div className="relative">
          <button
            onClick={() => navigate("/instructor")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/60 via-slate-900 to-purple-950/40 p-7 sm:p-10 mb-10">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
              <BarChart3 size={17} />
              INSTRUCTOR ANALYTICS
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  Teaching Analytics
                </h1>

                <p className="text-slate-400 text-base sm:text-lg mt-4 max-w-2xl">
                  Monitor your courses, students, lessons and overall
                  learning activity.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Average Progress
                  </p>

                  <p className="text-2xl font-bold">
                    {learning.average_progress ?? 0}%
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                Overview
              </p>

              <h2 className="text-2xl font-bold mt-1">
                Teaching Statistics
              </h2>

              <p className="text-slate-500 mt-1">
                A complete overview of your teaching activity.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard
                label="Total Courses"
                value={overview.total_courses ?? 0}
                icon={BookOpen}
                accent="blue"
              />

              <StatCard
                label="Published"
                value={overview.published_courses ?? 0}
                icon={Rocket}
                accent="emerald"
              />

              <StatCard
                label="Students"
                value={overview.total_students ?? 0}
                icon={Users}
                accent="purple"
              />

              <StatCard
                label="Active Students"
                value={overview.active_students ?? 0}
                icon={GraduationCap}
                accent="cyan"
              />

              <StatCard
                label="Modules"
                value={overview.total_modules ?? 0}
                icon={Layers3}
                accent="amber"
              />

              <StatCard
                label="Lessons"
                value={overview.total_lessons ?? 0}
                icon={FileText}
                accent="blue"
              />
            </div>
          </section>

          <section className="mb-10">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-purple-400 font-semibold">
                Learning Activity
              </p>

              <h2 className="text-2xl font-bold mt-1">
                Student Progress
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <LearningCard
                label="Total Enrollments"
                value={learning.total_enrollments ?? 0}
                icon={Users}
              />

              <LearningCard
                label="Completed Courses"
                value={learning.completed_courses ?? 0}
                icon={CheckCircle2}
              />

              <LearningCard
                label="Average Progress"
                value={`${learning.average_progress ?? 0}%`}
                icon={TrendingUp}
              />
            </div>
          </section>

          <section>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                  Your Workspace
                </p>

                <h2 className="text-2xl font-bold mt-1">
                  Course Performance
                </h2>

                <p className="text-slate-500 mt-1">
                  Detailed statistics for every course assigned to you.
                </p>
              </div>

              <button
                onClick={() => navigate("/instructor")}
                className="w-fit flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition text-sm font-medium"
              >
                <ArrowLeft size={16} />
                Dashboard
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-5">
                  <BarChart3 size={30} />
                </div>

                <h3 className="text-xl font-bold">
                  No course analytics available
                </h3>

                <p className="text-slate-500 mt-2">
                  Course analytics will appear here once courses are
                  assigned to you.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseAnalyticsCard
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
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }) {
  const accentStyles = {
    blue: "bg-blue-500/10 text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    purple: "bg-purple-500/10 text-purple-400",
    amber: "bg-amber-500/10 text-amber-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          accentStyles[accent]
        }`}
      >
        <Icon size={21} />
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

function LearningCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
        <Icon size={21} />
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

function CourseAnalyticsCard({ course, onManage }) {
  const isPublished = course.status === "PUBLISHED";

  const students = Number(course.students) || 0;
  const totalLessons = Number(course.total_lessons) || 0;
  const publishedLessons = Number(course.published_lessons) || 0;
  const completedRecords =
    Number(course.completed_lesson_records) || 0;

  const completion =
    totalLessons > 0 && students > 0
      ? Math.min(
          Math.round(
            (completedRecords / (totalLessons * students)) * 100
          ),
          100
        )
      : 0;

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/70 overflow-hidden hover:border-slate-700 hover:-translate-y-1 transition-all duration-300">
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

            {course.status || "DRAFT"}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-bold leading-snug">
          {course.course_title}
        </h3>

        <div className="grid grid-cols-3 border-y border-slate-800 mt-6 py-4">
          <CourseMetric
            icon={Users}
            label="Students"
            value={students}
          />

          <CourseMetric
            icon={FileText}
            label="Lessons"
            value={totalLessons}
          />

          <CourseMetric
            icon={Rocket}
            label="Published"
            value={publishedLessons}
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">
              Completion
            </span>

            <span className="text-sm font-bold">
              {completion}%
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <button
          onClick={onManage}
          className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
        >
          Manage Course
          <BarChart3 size={17} />
        </button>
      </div>
    </article>
  );
}

function CourseMetric({ icon: Icon, label, value }) {
  return (
    <div className="text-center">
      <Icon
        size={14}
        className="mx-auto text-slate-600 mb-1"
      />

      <p className="text-sm font-bold">
        {value}
      </p>

      <p className="text-[10px] text-slate-600">
        {label}
      </p>
    </div>
  );
}

export default InstructorAnalytics;