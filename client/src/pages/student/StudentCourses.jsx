import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Search,
  RefreshCw,
  Clock3,
  Layers3,
  FileText,
  CheckCircle2,
  Plus,
  Sparkles,
  GraduationCap,
  LogOut,
} from "lucide-react";
import api from "../../services/api";

function StudentCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [enrolling, setEnrolling] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/student/courses/browse");

      if (response.data.success) {
        setCourses(response.data.courses || []);
        setFilteredCourses(response.data.courses || []);
      } else {
        setError(response.data.message || "Failed to load courses");
      }
    } catch (err) {
      console.error("Fetch courses error:", err);

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

  // Filter courses based on search
  useEffect(() => {
    let filtered = courses;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title?.toLowerCase().includes(term) ||
          course.description?.toLowerCase().includes(term) ||
          course.level?.toLowerCase().includes(term)
      );
    }

    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  const handleEnroll = async (course) => {
    try {
      setEnrolling(course.id);
      setError("");

      const response = await api.post(
        `/enrollments/courses/${course.id}/enroll`
      );

      if (response.data.success) {
        // Refresh the list to update enrollment status
        await fetchCourses();
      } else {
        setError(response.data.message || "Failed to enroll in course");
      }
    } catch (err) {
      console.error("Enroll error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to enroll in course");
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold">Loading courses...</h2>
          <p className="text-slate-500 mt-2">Fetching available courses</p>
        </div>
      </div>
    );
  }

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
          <button
            onClick={() => navigate("/student")}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <GraduationCap size={20} />
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-bold leading-none">LMS</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                Student
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/student")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-8 lg:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/60 via-slate-900 to-purple-950/40 p-7 sm:p-10 mb-10">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
              <Sparkles size={16} />
              COURSE CATALOG
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Explore Courses
            </h1>
            <p className="text-slate-400 text-base sm:text-lg mt-4 max-w-2xl leading-relaxed">
              Browse all available courses and enroll to start learning.
            </p>
          </div>
        </section>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
            <RefreshCw size={19} />
            <span>{error}</span>
          </div>
        )}

        {/* SEARCH */}
        <section className="mb-8">
          <div className="relative max-w-xl">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, description, or level..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>
        </section>

        {/* COURSES GRID */}
        <section>
          {filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
                <BookOpen size={30} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-bold">No courses available</h3>
              <p className="text-slate-500 mt-2">
                {searchTerm
                  ? "Try adjusting your search."
                  : "No published courses found."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="group rounded-3xl border border-slate-800 bg-slate-900/70 overflow-hidden hover:border-slate-700 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/10"
                >
                  {/* CARD HEADER */}
                  <div className="relative h-36 overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950">
                    <div className="absolute -right-8 -top-12 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
                    <div className="absolute left-6 bottom-5 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                      <BookOpen size={22} className="text-blue-300" />
                    </div>

                    {course.level && (
                      <div className="absolute top-5 right-5">
                        <span className="px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md text-white text-xs font-medium border border-white/10">
                          {course.level}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CARD BODY */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold leading-snug group-hover:text-blue-400 transition">
                      {course.title}
                    </h3>

                    <p className="text-sm text-slate-500 leading-relaxed mt-3 line-clamp-3 min-h-[60px]">
                      {course.description || "No course description available."}
                    </p>

                    {/* METRICS */}
                    <div className="grid grid-cols-2 border-y border-slate-800 mt-5 py-4">
                      <div className="text-center">
                        <Layers3 size={16} className="mx-auto text-slate-600 mb-1" />
                        <p className="text-sm font-bold">{course.module_count}</p>
                        <p className="text-[10px] text-slate-600">Modules</p>
                      </div>
                      <div className="text-center">
                        <FileText size={16} className="mx-auto text-slate-600 mb-1" />
                        <p className="text-sm font-bold">{course.lesson_count}</p>
                        <p className="text-[10px] text-slate-600">Lessons</p>
                      </div>
                    </div>

                    {/* ENROLL BUTTON */}
                    {course.is_enrolled ? (
                      <button
                        onClick={() => navigate(`/student/courses/${course.id}`)}
                        className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold transition"
                      >
                        <CheckCircle2 size={18} />
                        Enrolled — Go to Course
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course)}
                        disabled={enrolling === course.id}
                        className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
                      >
                        <Plus size={18} />
                        {enrolling === course.id ? "Enrolling..." : "Enroll Now"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* COUNT */}
        <div className="mt-4 text-sm text-slate-500">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      </main>
    </div>
  );
}

export default StudentCourses;