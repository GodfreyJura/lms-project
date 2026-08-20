import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  RefreshCw,
  Trophy,
  Clock3,
  CheckCircle2,
  XCircle,
  GraduationCap,
  LogOut,
} from "lucide-react";
import api from "../../services/api";

function StudentQuizHistory() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/quiz-attempts/history");

      if (response.data.success) {
        setAttempts(response.data.attempts || []);
      } else {
        setError(response.data.message || "Failed to load quiz history");
      }
    } catch (err) {
      console.error("Fetch quiz history error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to load quiz history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getScoreBadge = (score) => {
    if (score === null || score === undefined) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
          <Clock3 size={13} />
          In Progress
        </span>
      );
    }

    const passed = score >= 50;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
          passed
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-red-500/10 text-red-400"
        }`}
      >
        {passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
        {score}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold">Loading quiz history...</h2>
          <p className="text-slate-500 mt-2">Fetching your attempts</p>
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

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/60 via-slate-900 to-purple-950/40 p-7 sm:p-10 mb-8">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
              <Trophy size={16} />
              MY QUIZZES
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Quiz History
            </h1>
            <p className="text-slate-400 mt-3">
              Review your past quiz attempts and scores.
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

        {/* ATTEMPTS LIST */}
        <section>
          {attempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
                <ClipboardList size={30} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-bold">No quiz attempts</h3>
              <p className="text-slate-500 mt-2">
                You haven't taken any quizzes yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <div
                  key={attempt.attempt_id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold truncate">
                        {attempt.quiz_title}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        {attempt.course_title}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>
                          Attempt #{attempt.attempt_number}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <ClipboardList size={13} />
                          {attempt.total_questions} questions
                        </span>

                        {attempt.submitted_at && (
                          <span>
                            {new Date(attempt.submitted_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      {getScoreBadge(attempt.score)}

                      {attempt.score !== null && attempt.score !== undefined && (
                        <button
                          onClick={() =>
                            navigate(
                              `/student/quiz-result/${attempt.attempt_id}`
                            )
                          }
                          className="mt-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* COUNT */}
        <div className="mt-4 text-sm text-slate-500">
          {attempts.length} total attempt{attempts.length !== 1 ? "s" : ""}
        </div>
      </main>
    </div>
  );
}

export default StudentQuizHistory;