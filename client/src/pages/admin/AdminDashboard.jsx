import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  Layers3,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/dashboard");

      if (response.data?.success) {
        setDashboard(response.data);
      } else {
        setError("Unable to load dashboard.");
      }
    } catch (err) {
      console.error("Admin dashboard error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (err.response?.status === 403) {
        setError("You do not have permission to access the admin dashboard.");
        return;
      }

      setError(
        err.response?.data?.message || "Failed to load the admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold">Loading dashboard...</h2>
          <p className="text-slate-500 mt-2">Preparing your admin workspace</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-red-900/50 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-5">
            <RefreshCw size={28} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Unable to load dashboard</h2>
          <p className="text-red-400 mb-7">{error}</p>
          <button
            onClick={loadDashboard}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statistics = dashboard?.statistics || {};
  const users = statistics.users || {};
  const courses = statistics.courses || {};
  const learning = statistics.learning || {};

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/60 via-slate-900 to-purple-950/40 p-7 sm:p-10 mb-10">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
            <Sparkles size={16} />
            ADMIN WORKSPACE
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Welcome back,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Administrator
                </span>
              </h1>
              <p className="text-slate-400 text-base sm:text-lg mt-4 max-w-2xl leading-relaxed">
                Manage your learning management system, monitor users,
                and track course performance.
              </p>
            </div>

            <button
              onClick={loadDashboard}
              className="w-fit flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold transition"
            >
              <RefreshCw size={18} />
              Refresh
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
            <h2 className="text-2xl font-bold mt-1">Platform Statistics</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={users.total_users ?? 0}
            icon={Users}
            accent="blue"
            subLabel={`${users.active_users ?? 0} active`}
          />

          <StatCard
            label="Total Courses"
            value={courses.total_courses ?? 0}
            icon={BookOpen}
            accent="purple"
            subLabel={`${courses.published_courses ?? 0} published`}
          />

          <StatCard
            label="Enrollments"
            value={learning.total_enrollments ?? 0}
            icon={ClipboardList}
            accent="emerald"
            subLabel={`${learning.active_enrollments ?? 0} active`}
          />

          <StatCard
            label="Learning Content"
            value={learning.total_modules ?? 0}
            icon={Layers3}
            accent="amber"
            subLabel={`${learning.total_lessons ?? 0} lessons`}
          />
        </div>
      </section>

      {/* SECONDARY STATS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            Users Breakdown
          </h3>
          <div className="space-y-4">
            <StatRow label="Students" value={users.total_students ?? 0} />
            <StatRow label="Instructors" value={users.total_instructors ?? 0} />
            <StatRow label="Administrators" value={users.total_admins ?? 0} />
            <StatRow label="Active" value={users.active_users ?? 0} highlight />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
            <BookOpen size={18} className="text-purple-400" />
            Course Status
          </h3>
          <div className="space-y-4">
            <StatRow label="Total" value={courses.total_courses ?? 0} />
            <StatRow label="Published" value={courses.published_courses ?? 0} highlight />
            <StatRow label="Draft" value={courses.draft_courses ?? 0} warning />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            Learning Activity
          </h3>
          <div className="space-y-4">
            <StatRow label="Enrollments" value={learning.total_enrollments ?? 0} />
            <StatRow label="Active" value={learning.active_enrollments ?? 0} highlight />
            <StatRow label="Modules" value={learning.total_modules ?? 0} />
            <StatRow label="Lessons" value={learning.total_lessons ?? 0} />
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mb-10">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
            Shortcuts
          </p>
          <h2 className="text-2xl font-bold mt-1">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            icon={Users}
            label="Manage Users"
            description="Create, update and manage users"
            onClick={() => navigate("/admin/users")}
            accent="blue"
          />
          <QuickAction
            icon={BookOpen}
            label="Manage Courses"
            description="Create and manage your courses"
            onClick={() => navigate("/admin/courses")}
            accent="purple"
          />
          <QuickAction
            icon={GraduationCap}
            label="Manage Instructors"
            description="Manage instructors and assignments"
            onClick={() => navigate("/admin/instructors")}
            accent="emerald"
          />
        </div>
      </section>

      {/* RECENT USERS */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Recent Users</h3>
              <p className="text-sm text-slate-500 mt-1">Latest registered users</p>
            </div>
            <button
              onClick={() => navigate("/admin/users")}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {dashboard?.recent_users?.length > 0 ? (
              dashboard.recent_users.map((user) => (
                <div key={user.id} className="p-5 flex items-center justify-between hover:bg-slate-800/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                      {user.first_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-xs font-medium text-slate-400">
                    {user.role}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">No users found.</div>
            )}
          </div>
        </div>

        {/* RECENT COURSES */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Recent Courses</h3>
              <p className="text-sm text-slate-500 mt-1">Latest courses added</p>
            </div>
            <button
              onClick={() => navigate("/admin/courses")}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {dashboard?.recent_courses?.length > 0 ? (
              dashboard.recent_courses.map((course) => (
                <div key={course.id} className="p-5 flex items-center justify-between hover:bg-slate-800/30 transition">
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-xs text-slate-500 mt-1">Course</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      course.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : course.status === "DRAFT"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {course.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">No courses found.</div>
            )}
          </div>
        </div>
      </section>

      {/* RECENT ENROLLMENTS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="font-semibold text-lg">Recent Enrollments</h3>
          <p className="text-sm text-slate-500 mt-1">Latest student course enrollments</p>
        </div>

        {dashboard?.recent_enrollments?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Student</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Course</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dashboard.recent_enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-medium">
                      {enrollment.first_name} {enrollment.last_name}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{enrollment.course_title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                        {enrollment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">No recent enrollments found.</div>
        )}
      </section>
    </>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({ label, value, icon: Icon, accent, subLabel }) {
  const accentStyles = {
    blue: "bg-blue-500/10 text-blue-400",
    purple: "bg-purple-500/10 text-purple-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
  };

  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accentStyles[accent]}`}>
          <Icon size={21} />
        </div>
        <ArrowRight size={16} className="text-slate-700 group-hover:text-slate-400 transition" />
      </div>
      <p className="text-sm text-slate-500 mt-5">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subLabel && (
        <p className="text-xs text-slate-500 mt-2">{subLabel}</p>
      )}
    </div>
  );
}

/* ============================================================
   STAT ROW
============================================================ */

function StatRow({ label, value, highlight, warning }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400">{label}</span>
      <span
        className={`font-semibold ${
          highlight
            ? "text-emerald-400"
            : warning
            ? "text-amber-400"
            : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({ icon: Icon, label, description, onClick, accent }) {
  const accentStyles = {
    blue: "hover:border-blue-500/30 hover:bg-blue-500/5",
    purple: "hover:border-purple-500/30 hover:bg-purple-500/5",
    emerald: "hover:border-emerald-500/30 hover:bg-emerald-500/5",
  };

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition ${accentStyles[accent]}`}
    >
      <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
        <Icon size={21} className="text-slate-400" />
      </div>
      <h4 className="font-semibold text-lg">{label}</h4>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </button>
  );
}

export default AdminDashboard;