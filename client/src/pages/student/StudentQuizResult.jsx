import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import api from "../../services/api";

function StudentQuizResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/quiz-attempts/attempts/${attemptId}/result`
      );

      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.message || "Failed to load quiz result");
      }
    } catch (err) {
      console.error("Fetch quiz result error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to load quiz result");
    } finally {
      setLoading(false);
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
          <h2 className="text-xl font-semibold">Loading result...</h2>
          <p className="text-slate-500 mt-2">Calculating your score</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-900/50 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-5">
            <XCircle size={28} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Unable to load result</h2>
          <p className="text-red-400 mb-7">{error}</p>
          <button
            onClick={() => navigate("/student")}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { attempt, result: quizResult, answers } = result;
  const score = quizResult?.score ?? attempt?.score ?? 0;
  const passed = score >= 50;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/student")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline font-medium">Dashboard</span>
          </button>

          <span className="text-sm text-slate-400">Quiz Result</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* SCORE CARD */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/60 via-slate-900 to-purple-950/40 p-8 text-center mb-8">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 ${
              passed
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {passed ? <Trophy size={45} /> : <XCircle size={45} />}
          </div>

          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
            Your Score
          </p>

          <p
            className={`text-6xl font-black mt-2 ${
              passed ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {score}%
          </p>

          <p className="text-slate-400 mt-3">
            {passed
              ? "Congratulations! You passed the quiz."
              : "Keep practicing and try again."}
          </p>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800">
            <div>
              <p className="text-2xl font-bold">
                {quizResult?.total_questions ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {quizResult?.correct_answers ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {quizResult?.incorrect_answers ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Incorrect</p>
            </div>
          </div>
        </div>

        {/* ANSWERS REVIEW */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <BookOpen size={18} className="text-blue-400" />
              Answer Review
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Review your answers below
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {answers?.map((answer, index) => (
              <div key={answer.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      answer.is_correct
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {answer.is_correct ? (
                      <CheckCircle2 size={19} />
                    ) : (
                      <XCircle size={19} />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold leading-relaxed">
                      {index + 1}. {answer.question_text}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {answer.points_earned}/{answer.question_points} points
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="mt-8 pb-10 flex gap-4">
          <button
            onClick={() => navigate("/student")}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <button
            onClick={fetchResult}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </main>
    </div>
  );
}

export default StudentQuizResult;