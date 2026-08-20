import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  FileText,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
} from "lucide-react";
import api from "../../services/api";

function StudentQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    startQuiz();
  }, [quizId]);

  const startQuiz = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.post(`/quiz-attempts/${quizId}/start`);

      if (response.data.success) {
        setAttempt(response.data.attempt);
        setQuiz(response.data.quiz);
        setQuestions(response.data.questions || []);
      } else {
        setError(response.data.message || "Failed to start quiz");
      }
    } catch (err) {
      console.error("Start quiz error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (err.response?.status === 500) {
        setError("This quiz has no questions yet. Please contact your instructor.");
      } else {
        setError(
          err.response?.data?.message || "Unable to start quiz"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selected_option_id: optionId,
        answer_text: null,
      },
    }));
  };

  const handleTextAnswer = (questionId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selected_option_id: null,
        answer_text: text,
      },
    }));
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter(
      (question) => !answers[question.id]
    );

    if (unanswered.length > 0) {
      const confirmed = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Submit anyway?`
      );
      if (!confirmed) return;
    }

    try {
      setSubmitting(true);
      setError("");

      const answersArray = Object.entries(answers).map(
        ([questionId, answer]) => ({
          question_id: questionId,
          selected_option_id: answer.selected_option_id || null,
          answer_text: answer.answer_text || null,
        })
      );

      const response = await api.post(
        `/quiz-attempts/attempts/${attempt.id}/submit`,
        { answers: answersArray }
      );

      if (response.data.success) {
        navigate(`/student/quiz-result/${attempt.id}`);
      } else {
        setError(response.data.message || "Failed to submit quiz");
      }
    } catch (err) {
      console.error("Submit quiz error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to submit quiz");
    } finally {
      setSubmitting(false);
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
          <h2 className="text-xl font-semibold">Starting quiz...</h2>
          <p className="text-slate-500 mt-2">Preparing your questions</p>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-900/50 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-5">
            <XCircle size={28} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Unable to start quiz</h2>
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

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

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
            <span className="hidden sm:inline font-medium">Exit Quiz</span>
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {answeredCount}/{totalQuestions} answered
            </span>

            {quiz?.time_limit_minutes && (
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <Clock3 size={15} />
                {quiz.time_limit_minutes} min
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* QUIZ INFO */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 mb-8">
          <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
            Quiz
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">
            {quiz?.title}
          </h1>
          {quiz?.description && (
            <p className="text-slate-400 mt-3">{quiz.description}</p>
          )}
        </div>

        {/* QUESTIONS */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const answer = answers[question.id];
            const questionType = question.question_type || "MULTIPLE_CHOICE";

            return (
              <div
                key={question.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <p className="text-lg font-semibold leading-relaxed">
                      {question.question_text}
                    </p>

                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-slate-500">
                        {question.points} point{question.points > 1 ? "s" : ""}
                      </p>

                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold">
                        {questionType.replace("_", " ")}
                      </span>
                    </div>

                    {/* MULTIPLE CHOICE or TRUE_FALSE */}
                    {(questionType === "MULTIPLE_CHOICE" ||
                      questionType === "TRUE_FALSE") && (
                      <div className="mt-5 space-y-3">
                        {question.options?.map((option) => {
                          const selected =
                            answer?.selected_option_id === option.id;

                          return (
                            <button
                              key={option.id}
                              onClick={() =>
                                handleOptionSelect(question.id, option.id)
                              }
                              className={`w-full text-left p-4 rounded-xl border transition ${
                                selected
                                  ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    selected
                                      ? "border-blue-400 bg-blue-400"
                                      : "border-slate-600"
                                  }`}
                                >
                                  {selected && (
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                  )}
                                </div>
                                <span>{option.option_text}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* SHORT ANSWER */}
                    {questionType === "SHORT_ANSWER" && (
                      <div className="mt-5">
                        <textarea
                          value={answer?.answer_text || ""}
                          onChange={(e) =>
                            handleTextAnswer(question.id, e.target.value)
                          }
                          placeholder="Type your answer here..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SUBMIT */}
        <div className="mt-8 pb-10">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={19} />
                Submit Quiz
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

export default StudentQuiz;