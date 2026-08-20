import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Users,
  Layers3,
  FileText,
  CheckCircle2,
  Clock3,
  Archive,
  ArrowRight,
  Pencil,
  Trash2,
} from "lucide-react";
import api from "../../services/api";

function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/courses");

      if (response.data.success) {
        setCourses(response.data.courses || []);
        setFilteredCourses(response.data.courses || []);
      } else {
        setError(response.data.message || "Failed to load courses");
      }
    } catch (err) {
      console.error("Fetch admin courses error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses based on search and status
  useEffect(() => {
    let filtered = courses;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title?.toLowerCase().includes(term) ||
          course.slug?.toLowerCase().includes(term) ||
          course.description?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((course) => course.status === statusFilter);
    }

    setFilteredCourses(filtered);
  }, [searchTerm, statusFilter, courses]);

  const handleDeleteCourse = async (course) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/admin/courses/${course.id}`);
      await fetchCourses();
    } catch (err) {
      console.error("Delete course error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      alert(err.response?.data?.message || "Unable to delete course");
    }
  };

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
          <h2 className="text-xl font-semibold">Loading courses...</h2>
          <p className="text-slate-500 mt-2">Fetching course management data</p>
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
          <h2 className="text-2xl font-bold mb-3">Unable to load courses</h2>
          <p className="text-red-400 mb-7">{error}</p>
          <button
            onClick={fetchCourses}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* HEADER */}
      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-2">
              Course Management
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Courses
            </h1>
            <p className="text-slate-400 mt-2">
              Manage all courses in your institution
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCourses}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition text-sm font-medium"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => navigate("/admin/courses/create")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-900/20"
            >
              <Plus size={17} />
              Add Course
            </button>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, slug, or description..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                  statusFilter === status
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* COURSES GRID */}
      <section>
        {filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
              <BookOpen size={30} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-bold">No courses found</h3>
            <p className="text-slate-500 mt-2">
              {searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your search or filters."
                : "No courses have been created yet."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/admin/courses/${course.id}`)}
                className="group rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden hover:border-slate-700 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xl shadow-black/10"
              >
                {/* CARD HEADER */}
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950">
                  <div className="absolute -right-8 -top-12 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
                  <div className="absolute left-6 bottom-5 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <BookOpen size={22} className="text-blue-300" />
                  </div>
                  <div className="absolute top-5 right-5">
                    {getStatusBadge(course.status)}
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="p-6">
                  <h3 className="text-lg font-bold leading-snug group-hover:text-blue-400 transition">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">{course.slug}</p>

                  <p className="text-sm text-slate-500 leading-relaxed mt-4 line-clamp-3">
                    {course.description || "No course description available."}
                  </p>

                  {/* METRICS */}
                  <div className="grid grid-cols-3 border-y border-slate-800 mt-6 py-4">
                    <div className="text-center">
                      <Users size={14} className="mx-auto text-slate-600 mb-1" />
                      <p className="text-sm font-bold">{course.student_count ?? 0}</p>
                      <p className="text-[10px] text-slate-600">Students</p>
                    </div>
                    <div className="text-center">
                      <Layers3 size={14} className="mx-auto text-slate-600 mb-1" />
                      <p className="text-sm font-bold">{course.module_count ?? 0}</p>
                      <p className="text-[10px] text-slate-600">Modules</p>
                    </div>
                    <div className="text-center">
                      <FileText size={14} className="mx-auto text-slate-600 mb-1" />
                      <p className="text-sm font-bold">{course.instructor_count ?? 0}</p>
                      <p className="text-[10px] text-slate-600">Instructors</p>
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="mt-5 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/courses/${course.id}/edit`);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/courses/${course.id}`);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-semibold transition"
                    >
                      View
                      <ArrowRight size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course);
                      }}
                      className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      title="Delete course"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* COURSE COUNT */}
      <div className="mt-4 text-sm text-slate-500">
        Showing {filteredCourses.length} of {courses.length} courses
      </div>
    </>
  );
}

export default AdminCourses;