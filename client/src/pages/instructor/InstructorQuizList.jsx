import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Trash2,
  Eye,
  GraduationCap,
  LogOut,
} from "lucide-react";
import api from "../../services/api";

function InstructorQuizList() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/quizzes/courses/${courseId}`);

      if (response.data.success) {
        setQuizzes(response.data.quizzes || []);
      } else {
        setError(response.data.message || "Failed to load quizzes");
      }
    } catch (err) {
      console.error("Fetch quizzes error:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(err.response?.data?.message || "Unable to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const handleDeleteQuiz = async (quiz) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${quiz.title}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/quizzes/${quiz.id}`);
      await fetchQuizzes();
    } catch (err) {
      console.error("Delete quiz error:", err);
      alert(err.response?.data?.message || "Unable to delete quiz");
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
          <h2 className="text-xl font-semibold">Loading quizzes...</h2>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(`/instructor/courses/${courseId}`)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline font-medium">Back to Course</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        {/* HERO */}
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/60 via-slate-900 to-purple-950/40 p-7 sm:p-10 mb-8">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
            <ClipboardList size={16} />
            QUIZ MANAGEMENT
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Course Quizzes
          </h1>
          <p className="text-slate-400 mt-3">
            Create and manage quizzes for this course.
          </p>
        </section>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
            <RefreshCw size={19} />
            <span>{error}</span>
          </div>
        )}

        {/* ADD BUTTON */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() =>
              navigate(`/instructor/courses/${courseId}/quizzes/create`)
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-900/20"
          >
            <Plus size={17} />
            Add Quiz
          </button>
        </div>

        {/* QUIZZES LIST */}
        <section>
          {quizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
                <ClipboardList size={30} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-bold">No quizzes yet</h3>
              <p className="text-slate-500 mt-2">
                Create your first quiz for this course.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold">{quiz.title}</h3>

                      {quiz.description && (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                          {quiz.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                        {quiz.time_limit_minutes && (
                          <span className="flex items-center gap-1.5">
                            <Clock3 size={13} />
                            {quiz.time_limit_minutes} min
                          </span>
                        )}

                        <span>{quiz.max_attempts} max attempts</span>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            quiz.is_published
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {quiz.is_published ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <Clock3 size={12} />
                          )}
                          {quiz.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() =>
                          navigate(
                            `/instructor/courses/${courseId}/quizzes/${quiz.id}`
                          )
                        }
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                        title="View quiz"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() => handleDeleteQuiz(quiz)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                        title="Delete quiz"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default InstructorQuizList;