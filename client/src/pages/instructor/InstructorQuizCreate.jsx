import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Save,
  CheckCircle2,
  RefreshCw,
  Clock3,
  LogOut,
} from "lucide-react";
import api from "../../services/api";

function InstructorQuizCreate() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    time_limit_minutes: "",
    max_attempts: 1,
    is_published: false,
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError("Quiz title is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        max_attempts: Number(form.max_attempts),
        is_published: form.is_published,
      };

      // Only include time_limit_minutes if it's provided
      if (form.time_limit_minutes !== "") {
        payload.time_limit_minutes = Number(form.time_limit_minutes);
      }

      const response = await api.post(
        `/quizzes/courses/${courseId}`,
        payload
      );

      if (response.data.success) {
        setMessage("Quiz created successfully!");

        setTimeout(() => {
          navigate(`/instructor/courses/${courseId}/quizzes`);
        }, 1500);
      } else {
        setError(response.data.message || "Failed to create quiz");
      }
    } catch (err) {
      console.error("Create quiz error:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(err.response?.data?.message || "Unable to create quiz");
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

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        {/* HEADER */}
        <section className="mb-8">
          <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-2">
            Quiz Management
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Create Quiz
          </h1>
          <p className="text-slate-400 mt-2">
            Add a new quiz to this course
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
              <ClipboardList size={18} className="text-blue-400" />
              Quiz Information
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Title */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Chapter 1 Quiz"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Description */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what this quiz covers..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Time Limit */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Time Limit (minutes)
                </label>
                <div className="relative">
                  <Clock3
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="number"
                    name="time_limit_minutes"
                    value={form.time_limit_minutes}
                    onChange={handleChange}
                    placeholder="Optional"
                    min="1"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
              </div>

              {/* Max Attempts */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Max Attempts
                </label>
                <input
                  type="number"
                  name="max_attempts"
                  value={form.max_attempts}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            {/* Publish Toggle */}
            <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950/50 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm({ ...form, is_published: e.target.checked })
                }
                className="w-4 h-4 accent-blue-600"
              />
              <div>
                <p className="text-sm font-semibold">Publish immediately</p>
                <p className="text-xs text-slate-500 mt-1">
                  Students will be able to take this quiz.
                </p>
              </div>
            </label>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 pt-5 border-t border-slate-800">
              <button
                type="button"
                onClick={() =>
                  navigate(`/instructor/courses/${courseId}/quizzes`)
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
                {saving ? "Creating..." : "Create Quiz"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default InstructorQuizCreate;