import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Save,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";

function AdminCourseEdit() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnail_url: "",
    level: "",
    status: "DRAFT",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/admin/courses/${courseId}`);

      if (response.data.success) {
        const course = response.data.course;
        setForm({
          title: course.title || "",
          slug: course.slug || "",
          description: course.description || "",
          thumbnail_url: course.thumbnail_url || "",
          level: course.level || "",
          status: course.status || "DRAFT",
        });
      } else {
        setError(response.data.message || "Failed to load course");
      }
    } catch (err) {
      console.error("Fetch course error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setForm({
      ...form,
      title,
      slug,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.title.trim() || !form.slug.trim()) {
      setError("Title and slug are required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description.trim() || null,
        thumbnail_url: form.thumbnail_url.trim() || null,
        level: form.level.trim() || null,
        status: form.status,
      };

      const response = await api.put(`/admin/courses/${courseId}`, payload);

      if (response.data.success) {
        setMessage("Course updated successfully!");

        setTimeout(() => {
          navigate("/admin/courses");
        }, 1500);
      } else {
        setError(response.data.message || "Failed to update course");
      }
    } catch (err) {
      console.error("Update course error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to update course");
    } finally {
      setSaving(false);
    }
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
          <p className="text-slate-500 mt-2">Fetching course data</p>
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

      {/* HEADER */}
      <section className="mb-8">
        <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-2">
          Course Management
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Edit Course
        </h1>
        <p className="text-slate-400 mt-2">
          Update course information
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
            <BookOpen size={18} className="text-blue-400" />
            Course Information
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Update the course details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="e.g. Introduction to Web Development"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="introduction-to-web-development"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Level
              </label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition appearance-none cursor-pointer"
              >
                <option value="" className="bg-slate-800">Select level...</option>
                <option value="BEGINNER" className="bg-slate-800">Beginner</option>
                <option value="INTERMEDIATE" className="bg-slate-800">Intermediate</option>
                <option value="ADVANCED" className="bg-slate-800">Advanced</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition appearance-none cursor-pointer"
              >
                <option value="DRAFT" className="bg-slate-800">Draft</option>
                <option value="PUBLISHED" className="bg-slate-800">Published</option>
                <option value="ARCHIVED" className="bg-slate-800">Archived</option>
              </select>
            </div>

            {/* Thumbnail URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Thumbnail URL
              </label>
              <input
                type="url"
                name="thumbnail_url"
                value={form.thumbnail_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what this course covers..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition resize-none"
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate("/admin/courses")}
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
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default AdminCourseEdit;