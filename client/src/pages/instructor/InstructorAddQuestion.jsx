import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Save,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  LogOut,
} from "lucide-react";
import api from "../../services/api";

function InstructorAddQuestion() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    question_text: "",
    question_type: "MULTIPLE_CHOICE",
    points: 1,
    position: 1,
  });

  const [options, setOptions] = useState([
    { option_text: "", is_correct: false, position: 1 },
    { option_text: "", is_correct: false, position: 2 },
    { option_text: "", is_correct: false, position: 3 },
    { option_text: "", is_correct: false, position: 4 },
  ]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...options];
    updatedOptions[index][field] = value;
    setOptions(updatedOptions);
  };

  const handleCorrectChange = (index) => {
    const updatedOptions = options.map((option, i) => ({
      ...option,
      is_correct: i === index,
    }));
    setOptions(updatedOptions);
  };

  const handleAddOption = () => {
    setOptions([
      ...options,
      {
        option_text: "",
        is_correct: false,
        position: options.length + 1,
      },
    ]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      alert("A multiple choice question needs at least 2 options.");
      return;
    }
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.question_text.trim()) {
      setError("Question text is required.");
      return;
    }

    // Validate options
    const filledOptions = options.filter(
      (option) => option.option_text.trim() !== ""
    );

    if (filledOptions.length < 2) {
      setError("At least 2 options are required.");
      return;
    }

    const hasCorrect = options.some((option) => option.is_correct);

    if (!hasCorrect) {
      setError("Please mark one option as correct.");
      return;
    }

    try {
      setSaving(true);

      // Create question
      const questionResponse = await api.post(
        `/questions/quizzes/${quizId}/questions`,
        {
          question_text: form.question_text.trim(),
          question_type: form.question_type,
          points: Number(form.points),
          position: Number(form.position),
        }
      );

      if (!questionResponse.data.success) {
        setError(questionResponse.data.message || "Failed to create question");
        setSaving(false);
        return;
      }

      const questionId = questionResponse.data.question.id;

      // Create options
      for (const option of options) {
        if (option.option_text.trim() === "") continue;

        await api.post(`/questions/${questionId}/options`, {
          option_text: option.option_text.trim(),
          is_correct: option.is_correct,
          position: option.position,
        });
      }

      setMessage("Question added successfully!");

      setTimeout(() => {
        navigate(`/instructor/courses/${courseId}/quizzes/${quizId}`);
      }, 1500);
    } catch (err) {
      console.error("Add question error:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(err.response?.data?.message || "Unable to add question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute top-[40%] -left-40 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() =>
              navigate(`/instructor/courses/${courseId}/quizzes/${quizId}`)
            }
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline font-medium">Back to Quiz</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        {/* HEADER */}
        <section className="mb-8">
          <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-2">
            Quiz Management
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Add Question
          </h1>
          <p className="text-slate-400 mt-2">
            Create a multiple choice question with options
          </p>
        </section>

        {/* ALERTS */}
        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-emerald-300">
            <CheckCircle2 size={20} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
            <RefreshCw size={19} />
            <span>{error}</span>
          </div>
        )}

        {/* FORM */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FileText size={18} className="text-blue-400" />
              Question Details
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Question Text */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Question Text *
              </label>
              <textarea
                name="question_text"
                value={form.question_text}
                onChange={handleChange}
                placeholder="e.g. What is the capital of France?"
                rows={3}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Points */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Points *
                </label>
                <input
                  type="number"
                  name="points"
                  value={form.points}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Position *
                </label>
                <input
                  type="number"
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            {/* OPTIONS */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Options *
              </label>

              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleCorrectChange(index)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                        option.is_correct
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-500 border border-slate-700"
                      }`}
                      title="Mark as correct"
                    >
                      <CheckCircle2 size={18} />
                    </button>

                    <input
                      type="text"
                      value={option.option_text}
                      onChange={(e) =>
                        handleOptionChange(index, "option_text", e.target.value)
                      }
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddOption}
                className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition text-sm"
              >
                <Plus size={15} />
                Add Option
              </button>

              <p className="text-xs text-slate-500 mt-2">
                Click the check icon to mark the correct answer.
              </p>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 pt-5 border-t border-slate-800">
              <button
                type="button"
                onClick={() =>
                  navigate(`/instructor/courses/${courseId}/quizzes/${quizId}`)
                }
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Question"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default InstructorAddQuestion;