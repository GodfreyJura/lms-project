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
  FileText,
  LogOut,
} from "lucide-react";
import api from "../../services/api";

function InstructorQuizDetails() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const [quizResponse, questionsResponse] = await Promise.all([
        api.get(`/quizzes/${quizId}`),
        api.get(`/questions/quizzes/${quizId}/questions`),
      ]);

      if (quizResponse.data.success) {
        setQuiz(quizResponse.data.quiz);
      }

      if (questionsResponse.data.success) {
        setQuestions(questionsResponse.data.questions || []);
      }
    } catch (err) {
      console.error("Fetch quiz details error:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(err.response?.data?.message || "Unable to load quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizDetails();
  }, [quizId]);

  const handleDeleteQuestion = async (question) => {
    const confirmed = window.confirm(
      `Delete question "${question.question_text.substring(0, 50)}..."?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/questions/${question.id}`);
      await fetchQuizDetails();
    } catch (err) {
      console.error("Delete question error:", err);
      alert(err.response?.data?.message || "Unable to delete question");
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
          <h2 className="text-xl font-semibold">Loading quiz...</h2>
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
            onClick={() =>
              navigate(`/instructor/courses/${courseId}/quizzes`)
            }
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline font-medium">Back to Quizzes</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        {/* QUIZ HEADER */}
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/60 via-slate-900 to-purple-950/40 p-7 sm:p-10 mb-8">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
            <ClipboardList size={16} />
            QUIZ DETAILS
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {quiz?.title || "Quiz"}
          </h1>

          {quiz?.description && (
            <p className="text-slate-400 mt-3">{quiz.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-5">
            {quiz?.time_limit_minutes && (
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <Clock3 size={15} />
                {quiz.time_limit_minutes} min
              </span>
            )}

            <span className="text-sm text-slate-400">
              {quiz?.max_attempts} max attempts
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                quiz?.is_published
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {quiz?.is_published ? (
                <CheckCircle2 size={13} />
              ) : (
                <Clock3 size={13} />
              )}
              {quiz?.is_published ? "Published" : "Draft"}
            </span>
          </div>
        </section>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
            <RefreshCw size={19} />
            <span>{error}</span>
          </div>
        )}

        {/* ADD QUESTION BUTTON */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Questions ({questions.length})
          </h2>

          <button
            onClick={() =>
              navigate(
                `/instructor/courses/${courseId}/quizzes/${quizId}/add-question`
              )
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-900/20"
          >
            <Plus size={17} />
            Add Question
          </button>
        </div>

        {/* QUESTIONS LIST */}
        <section>
          {questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
                <FileText size={30} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-bold">No questions yet</h3>
              <p className="text-slate-500 mt-2">
                Add your first question to this quiz.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 hover:border-slate-700 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold leading-relaxed">
                        {question.question_text}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        <span>{question.question_type}</span>
                        <span>•</span>
                        <span>{question.points} point{question.points > 1 ? "s" : ""}</span>
                      </div>

                      {/* OPTIONS */}
                      {question.options && question.options.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {question.options.map((option) => (
                            <div
                              key={option.id}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
                                option.is_correct
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {option.is_correct ? (
                                <CheckCircle2 size={14} />
                              ) : (
                                <Clock3 size={14} />
                              )}
                              {option.option_text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteQuestion(question)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition flex-shrink-0"
                      title="Delete question"
                    >
                      <Trash2 size={15} />
                    </button>
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

export default InstructorQuizDetails;