import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Users,
  Layers3,
  FileText,
  GraduationCap,
  RefreshCw,
  Archive,
} from "lucide-react";
import api from "../../services/api";

function AdminCourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [modules, setModules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError("");

      const [courseResponse, instructorsResponse, modulesResponse] =
        await Promise.all([
          api.get(`/admin/courses/${courseId}`),
          api.get(`/admin/courses/${courseId}/instructors`),
          api.get(`/admin/courses/${courseId}/modules`),
        ]);

      if (courseResponse.data.success) {
        setCourse(courseResponse.data.course);
      }

      if (instructorsResponse.data.success) {
        setInstructors(instructorsResponse.data.instructors || []);
      }

      if (modulesResponse.data.success) {
        setModules(modulesResponse.data.modules || []);
      }
    } catch (err) {
      console.error("Fetch course details error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to load course details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const getStatusBadge = (status) => {
    const statusStyles = {
      PUBLISHED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      DRAFT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      ARCHIVED: "bg-slate-800 text-slate-400 border-slate-700",
    };

    const statusIcons = {
      PUBLISHED: CheckCircle2,
      DRAFT: Clock3,
      ARCHIVED: Archive,
    };

    const Icon = statusIcons[status] || Clock3;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusStyles[status]}`}
      >
        <Icon size={13} />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold">Loading course...</h2>
          <p className="text-slate-500 mt-2">Fetching course details</p>
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
          <h2 className="text-2xl font-bold mb-3">Unable to load course</h2>
          <p className="text-red-400 mb-7">{error}</p>
          <button
            onClick={fetchCourseData}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={50} className="mx-auto text-slate-700 mb-4" />
          <h2 className="text-xl font-semibold">Course not found</h2>
          <button
            onClick={() => navigate("/admin/courses")}
            className="mt-4 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/admin/courses")}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
      >
        <ArrowLeft size={17} />
        Back to Courses
      </button>

      {/* COURSE HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/60 via-slate-900 to-purple-950/40 p-7 sm:p-10 mb-10">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
                <BookOpen size={17} />
                COURSE DETAILS
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                {course.title}
              </h1>

              <p className="text-slate-400 text-base sm:text-lg mt-4 max-w-2xl leading-relaxed">
                {course.description || "No course description available."}
              </p>

              <div className="flex flex-wrap gap-2 mt-6">
                {course.level && (
                  <span className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                    Level: {course.level}
                  </span>
                )}

                {course.slug && (
                  <span className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                    {course.slug}
                  </span>
                )}

                {getStatusBadge(course.status)}
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <BookOpen size={30} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
            <Users size={21} />
          </div>
          <p className="text-sm text-slate-500">Students</p>
          <p className="text-3xl font-bold mt-1">{course.total_students ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
            <Layers3 size={21} />
          </div>
          <p className="text-sm text-slate-500">Modules</p>
          <p className="text-3xl font-bold mt-1">{modules.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
            <FileText size={21} />
          </div>
          <p className="text-sm text-slate-500">Lessons</p>
          <p className="text-3xl font-bold mt-1">
            {modules.reduce((total, module) => total + (module.lesson_count || 0), 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <GraduationCap size={21} />
          </div>
          <p className="text-sm text-slate-500">Instructors</p>
          <p className="text-3xl font-bold mt-1">{instructors.length}</p>
        </div>
      </section>

      {/* INSTRUCTORS */}
      <section className="mb-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-purple-400 font-semibold">
              Teaching Team
            </p>
            <h2 className="text-2xl font-bold mt-1">Course Instructors</h2>
          </div>

          <button
            onClick={() =>
              navigate(`/admin/courses/${courseId}/instructors`)
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition text-sm"
          >
            Manage Instructors
          </button>
        </div>

        {instructors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center">
            <GraduationCap size={30} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500">No instructors assigned to this course.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                    {(instructor.first_name || "I").charAt(0).toUpperCase()}
                    {(instructor.last_name || "").charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {instructor.first_name} {instructor.last_name}
                    </p>
                    <p className="text-sm text-slate-500 truncate mt-1">
                      {instructor.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODULES */}
      <section>
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
            Course Content
          </p>
          <h2 className="text-2xl font-bold mt-1">Modules</h2>
        </div>

        {modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center">
            <Layers3 size={30} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500">No modules have been created yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module, index) => (
              <div
                key={module.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold">{module.title}</h3>
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
                        {module.lesson_count || 0} lessons
                      </span>
                    </div>

                    {module.description && (
                      <p className="text-sm text-slate-500 mt-2 leading-6">
                        {module.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default AdminCourseDetails;