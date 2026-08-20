import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  GraduationCap,
  Layers3,
  LogOut,
  Pencil,
  Plus,
  Rocket,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import api from "../../services/api";

function InstructorCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [moduleModal, setModuleModal] = useState({
    open: false,
    mode: "create",
    module: null,
  });

  const [lessonModal, setLessonModal] = useState({
    open: false,
    mode: "create",
    moduleId: null,
    lesson: null,
  });

  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    content: "",
    video_url: "",
    duration_minutes: "",
    is_published: false,
  });

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/courses/${courseId}`);

      if (!response.data.success) {
        setError(
          response.data.message || "Unable to load course."
        );
        return;
      }

      setCourse(response.data.course);

      await loadModules();
    } catch (err) {
      console.error("Instructor course error:", err);

      if (err.response?.status === 401) {
        logout();
        return;
      }

      if (err.response?.status === 403) {
        setError(
          "You do not have permission to manage this course."
        );
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load course."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    const response = await api.get(
      `/instructor/courses/${courseId}/modules`
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Unable to load modules."
      );
    }

    const modulesFromServer = response.data.modules || [];

    const modulesWithLessons = await Promise.all(
      modulesFromServer.map(async (module) => {
        try {
          const lessonResponse = await api.get(
            `/instructor/modules/${module.id}/lessons`
          );

          return {
            ...module,
            lessons: lessonResponse.data.success
              ? lessonResponse.data.lessons || []
              : [],
          };
        } catch (err) {
          console.error(
            `Unable to load lessons for module ${module.id}:`,
            err
          );

          return {
            ...module,
            lessons: [],
          };
        }
      })
    );

    setModules(modulesWithLessons);
  };

  /* -------------------------------------------------------------------------- */
  /* MODULES                                                                     */
  /* -------------------------------------------------------------------------- */

  const openCreateModule = () => {
    setModuleForm({
      title: "",
      description: "",
    });

    setModuleModal({
      open: true,
      mode: "create",
      module: null,
    });
  };

  const openEditModule = (module) => {
    setModuleForm({
      title: module.title || "",
      description: module.description || "",
    });

    setModuleModal({
      open: true,
      mode: "edit",
      module,
    });
  };

  const closeModuleModal = () => {
    if (actionLoading) return;

    setModuleModal({
      open: false,
      mode: "create",
      module: null,
    });

    setModuleForm({
      title: "",
      description: "",
    });
  };

  const handleModuleSubmit = async (event) => {
    event.preventDefault();

    const title = moduleForm.title.trim();
    const description = moduleForm.description.trim();

    if (!title) {
      alert("Module title is required.");
      return;
    }

    try {
      setActionLoading(true);

      const payload = {
        title,
        description: description || null,
      };

      if (moduleModal.mode === "create") {
        await api.post(
          `/instructor/courses/${courseId}/modules`,
          payload
        );
      } else {
        await api.put(
          `/instructor/courses/${courseId}/modules/${moduleModal.module.id}`,
          payload
        );
      }

      closeModuleModal();
      await loadModules();
    } catch (err) {
      console.error("Module save error:", err);

      if (err.response?.status === 401) {
        logout();
        return;
      }

      alert(
        err.response?.data?.message ||
          "Unable to save module."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteModule = async (module) => {
    const confirmed = window.confirm(
      `Delete "${module.title}"?\n\nThis may also remove lessons belonging to this module.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      await api.delete(
        `/instructor/courses/${courseId}/modules/${module.id}`
      );

      await loadModules();
    } catch (err) {
      console.error("Delete module error:", err);

      if (err.response?.status === 401) {
        logout();
        return;
      }

      alert(
        err.response?.data?.message ||
          "Unable to delete module."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* LESSONS                                                                     */
  /* -------------------------------------------------------------------------- */

  const openCreateLesson = (moduleId) => {
    setLessonForm({
      title: "",
      content: "",
      video_url: "",
      duration_minutes: "",
      is_published: false,
    });

    setLessonModal({
      open: true,
      mode: "create",
      moduleId,
      lesson: null,
    });
  };

  const openEditLesson = (moduleId, lesson) => {
    setLessonForm({
      title: lesson.title || "",
      content: lesson.content || "",
      video_url: lesson.video_url || "",
      duration_minutes:
        lesson.duration_minutes ?? "",
      is_published: Boolean(lesson.is_published),
    });

    setLessonModal({
      open: true,
      mode: "edit",
      moduleId,
      lesson,
    });
  };

  const closeLessonModal = () => {
    if (actionLoading) return;

    setLessonModal({
      open: false,
      mode: "create",
      moduleId: null,
      lesson: null,
    });

    setLessonForm({
      title: "",
      content: "",
      video_url: "",
      duration_minutes: "",
      is_published: false,
    });
  };

  const handleLessonSubmit = async (event) => {
    event.preventDefault();

    const title = lessonForm.title.trim();

    if (!title) {
      alert("Lesson title is required.");
      return;
    }

    if (
      lessonForm.duration_minutes !== "" &&
      Number(lessonForm.duration_minutes) < 0
    ) {
      alert("Duration cannot be negative.");
      return;
    }

    try {
      setActionLoading(true);

      const payload = {
        title,
        content: lessonForm.content.trim() || null,
        video_url:
          lessonForm.video_url.trim() || null,
        duration_minutes:
          lessonForm.duration_minutes === ""
            ? null
            : Number(lessonForm.duration_minutes),
        is_published: Boolean(
          lessonForm.is_published
        ),
      };

      if (lessonModal.mode === "create") {
        await api.post(
          `/instructor/modules/${lessonModal.moduleId}/lessons`,
          payload
        );
      } else {
        await api.put(
          `/instructor/modules/${lessonModal.moduleId}/lessons/${lessonModal.lesson.id}`,
          payload
        );
      }

      closeLessonModal();
      await loadModules();
    } catch (err) {
      console.error("Lesson save error:", err);

      if (err.response?.status === 401) {
        logout();
        return;
      }

      alert(
        err.response?.data?.message ||
          "Unable to save lesson."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLesson = async (
    moduleId,
    lesson
  ) => {
    const confirmed = window.confirm(
      `Delete "${lesson.title}"?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      await api.delete(
        `/instructor/modules/${moduleId}/lessons/${lesson.id}`
      );

      await loadModules();
    } catch (err) {
      console.error("Delete lesson error:", err);

      if (err.response?.status === 401) {
        logout();
        return;
      }

      alert(
        err.response?.data?.message ||
          "Unable to delete lesson."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLessonPublication = async (
    moduleId,
    lesson
  ) => {
    try {
      setActionLoading(true);

      await api.patch(
        `/instructor/modules/${moduleId}/lessons/${lesson.id}/publish`
      );

      await loadModules();
    } catch (err) {
      console.error(
        "Lesson publication error:",
        err
      );

      if (err.response?.status === 401) {
        logout();
        return;
      }

      alert(
        err.response?.data?.message ||
          "Unable to change publication status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* STATISTICS                                                                  */
  /* -------------------------------------------------------------------------- */

  const totalLessons = modules.reduce(
    (total, module) =>
      total + (module.lessons?.length || 0),
    0
  );

  const publishedLessons = modules.reduce(
    (total, module) =>
      total +
      (module.lessons || []).filter(
        (lesson) => lesson.is_published
      ).length,
    0
  );

  const draftLessons =
    totalLessons - publishedLessons;

  const instructors = course?.instructors || [];
  const statistics = course?.statistics || {};

  /* -------------------------------------------------------------------------- */
  /* LOADING                                                                      */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-6 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />

          <h2 className="text-xl font-bold">
            Loading course...
          </h2>

          <p className="text-slate-500 mt-2">
            Preparing your course workspace.
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* ERROR                                                                        */
  /* -------------------------------------------------------------------------- */

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-red-900/50 bg-slate-900 p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <BookOpen size={28} />
          </div>

          <h2 className="text-2xl font-bold">
            Unable to load course
          </h2>

          <p className="text-red-400 mt-3">
            {error || "Course information is unavailable."}
          </p>

          <div className="flex justify-center gap-3 mt-7">
            <button
              onClick={loadCourse}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
            >
              Try Again
            </button>

            <button
              onClick={() => navigate("/instructor")}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold transition"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* BACKGROUND EFFECTS */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute top-[45%] -left-40 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/instructor")}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <GraduationCap size={20} />
            </div>

            <div className="hidden sm:block text-left">
              <p className="font-bold leading-none">
                LMS
              </p>

              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                Instructor
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/instructor")}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>

            <button
              onClick={logout}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div className="relative">
          {/* BREADCRUMB */}

          <button
            onClick={() => navigate("/instructor")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          {/* HERO */}

          <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/60 via-slate-900 to-purple-950/40 p-7 sm:p-10 mb-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
                  <BookOpen size={17} />
                  COURSE MANAGEMENT
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  {course.title}
                </h1>

                <p className="text-slate-400 text-base sm:text-lg mt-4 max-w-3xl">
                  Manage your course structure, learning
                  content, lessons and publication status.
                </p>

                <div className="flex flex-wrap gap-2 mt-6">
                  {course.level && (
                    <span className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                      Level: {course.level}
                    </span>
                  )}

                  {course.slug && (
                    <span className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                      {course.slug}
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      course.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {course.status === "PUBLISHED" ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <Clock3 size={13} />
                    )}

                    {course.status || "DRAFT"}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <BookOpen size={30} />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <p className="text-sm text-slate-500 leading-7 max-w-4xl">
                {course.description ||
                  "No course description available."}
              </p>
            </div>
          </section>

          {/* COURSE STATISTICS */}

          <section className="mb-10">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                Overview
              </p>

              <h2 className="text-2xl font-bold mt-1">
                Course Statistics
              </h2>

              <p className="text-slate-500 mt-1">
                A complete overview of this course.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <CourseStat
                label="Students"
                value={
                  statistics.total_students ?? 0
                }
                icon={Users}
                accent="purple"
              />

              <CourseStat
                label="Modules"
                value={modules.length}
                icon={Layers3}
                accent="amber"
              />

              <CourseStat
                label="Lessons"
                value={totalLessons}
                icon={FileText}
                accent="blue"
              />

              <CourseStat
                label="Published"
                value={publishedLessons}
                icon={Rocket}
                accent="emerald"
              />

              <CourseStat
                label="Draft Lessons"
                value={draftLessons}
                icon={Clock3}
                accent="amber"
              />

              <CourseStat
                label="Instructors"
                value={instructors.length}
                icon={GraduationCap}
                accent="cyan"
              />
            </div>
          </section>

          {/* INSTRUCTORS */}

          <section className="mb-10">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-purple-400 font-semibold">
                Teaching Team
              </p>

              <h2 className="text-2xl font-bold mt-1">
                Course Instructors
              </h2>

              <p className="text-slate-500 mt-1">
                Instructors currently assigned to this
                course.
              </p>
            </div>

            {instructors.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No instructors assigned"
                description="There are currently no instructors assigned to this course."
              />
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {instructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                        {(instructor.first_name || "I")
                          .charAt(0)
                          .toUpperCase()}
                        {(instructor.last_name || "")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {instructor.first_name}{" "}
                          {instructor.last_name}
                        </p>

                        <p className="text-sm text-slate-500 truncate mt-1">
                          {instructor.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* COURSE CONTENT */}

          <section>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                  Your Workspace
                </p>

                <h2 className="text-2xl font-bold mt-1">
                  Course Content
                </h2>

                <p className="text-slate-500 mt-1">
                  Build and manage modules and lessons.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
  <button
    onClick={() =>
      navigate(`/instructor/courses/${courseId}/quizzes`)
    }
    className="w-fit flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition"
  >
    <ClipboardList size={18} />
    Quizzes
  </button>

  <button
    onClick={openCreateModule}
    disabled={actionLoading}
    className="w-fit flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-50"
  >
    <Plus size={18} />
    Add Module
  </button>
</div>
            </div>

            {modules.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-5">
                  <Layers3 size={30} />
                </div>

                <h3 className="text-xl font-bold">
                  No modules yet
                </h3>

                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                  Start building this course by
                  creating your first module.
                </p>

                <button
                  onClick={openCreateModule}
                  disabled={actionLoading}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                >
                  <Plus size={18} />
                  Create First Module
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {modules.map((module, index) => {
                  const lessons = module.lessons || [];

                  return (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      index={index}
                      lessons={lessons}
                      actionLoading={actionLoading}
                      onEditModule={() =>
                        openEditModule(module)
                      }
                      onDeleteModule={() =>
                        handleDeleteModule(module)
                      }
                      onAddLesson={() =>
                        openCreateLesson(module.id)
                      }
                      onEditLesson={(lesson) =>
                        openEditLesson(
                          module.id,
                          lesson
                        )
                      }
                      onDeleteLesson={(lesson) =>
                        handleDeleteLesson(
                          module.id,
                          lesson
                        )
                      }
                      onTogglePublication={(lesson) =>
                        handleToggleLessonPublication(
                          module.id,
                          lesson
                        )
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* MODULE MODAL */}

      {moduleModal.open && (
        <ModalOverlay onClose={closeModuleModal}>
          <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
            <ModalHeader
              eyebrow="COURSE CONTENT"
              title={
                moduleModal.mode === "create"
                  ? "Create Module"
                  : "Edit Module"
              }
              onClose={closeModuleModal}
              disabled={actionLoading}
            />

            <form
              onSubmit={handleModuleSubmit}
              className="p-6 sm:p-7"
            >
              <FormLabel>Module Title</FormLabel>

              <input
                className="darkInput"
                type="text"
                value={moduleForm.title}
                onChange={(event) =>
                  setModuleForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="e.g. Introduction to Programming"
                autoFocus
              />

              <FormLabel>Description</FormLabel>

              <textarea
                className="darkTextarea"
                value={moduleForm.description}
                onChange={(event) =>
                  setModuleForm((current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }))
                }
                placeholder="Describe what this module covers..."
                rows={5}
              />

              <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModuleModal}
                  disabled={actionLoading}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-50"
                >
                  {actionLoading
                    ? "Saving..."
                    : moduleModal.mode === "create"
                    ? "Create Module"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* LESSON MODAL */}

      {lessonModal.open && (
        <ModalOverlay onClose={closeLessonModal}>
          <div className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <ModalHeader
              eyebrow="LESSON MANAGEMENT"
              title={
                lessonModal.mode === "create"
                  ? "Create Lesson"
                  : "Edit Lesson"
              }
              onClose={closeLessonModal}
              disabled={actionLoading}
            />

            <form
              onSubmit={handleLessonSubmit}
              className="p-6 sm:p-7"
            >
              <FormLabel>Lesson Title</FormLabel>

              <input
                className="darkInput"
                type="text"
                value={lessonForm.title}
                onChange={(event) =>
                  setLessonForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="e.g. What is Computer Science?"
                autoFocus
              />

              <FormLabel>Lesson Content</FormLabel>

              <textarea
                className="darkTextarea"
                value={lessonForm.content}
                onChange={(event) =>
                  setLessonForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                placeholder="Enter the lesson learning content..."
                rows={9}
              />

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <FormLabel>Video URL</FormLabel>

                  <div className="relative">
                    <Video
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      className="darkInput pl-10"
                      type="url"
                      value={lessonForm.video_url}
                      onChange={(event) =>
                        setLessonForm((current) => ({
                          ...current,
                          video_url:
                            event.target.value,
                        }))
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <FormLabel>
                    Duration (minutes)
                  </FormLabel>

                  <div className="relative">
                    <Clock3
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      className="darkInput pl-10"
                      type="number"
                      min="0"
                      step="1"
                      value={
                        lessonForm.duration_minutes
                      }
                      onChange={(event) =>
                        setLessonForm((current) => ({
                          ...current,
                          duration_minutes:
                            event.target.value,
                        }))
                      }
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 mt-6 p-4 rounded-2xl border border-slate-800 bg-slate-950/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    lessonForm.is_published
                  }
                  onChange={(event) =>
                    setLessonForm((current) => ({
                      ...current,
                      is_published:
                        event.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-blue-600"
                />

                <div>
                  <p className="text-sm font-semibold">
                    Publish this lesson immediately
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Students will be able to access
                    this lesson.
                  </p>
                </div>
              </label>

              <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeLessonModal}
                  disabled={actionLoading}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-50"
                >
                  {actionLoading
                    ? "Saving..."
                    : lessonModal.mode === "create"
                    ? "Create Lesson"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ACTION INDICATOR */}

      {actionLoading && (
        <div className="fixed bottom-5 right-5 z-[2000] flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
          <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-blue-400 animate-spin" />

          <span className="text-sm font-medium">
            Processing...
          </span>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COURSE STAT                                                                 */
/* -------------------------------------------------------------------------- */

function CourseStat({
  label,
  value,
  icon: Icon,
  accent,
}) {
  const accents = {
    blue: "bg-blue-500/10 text-blue-400",
    emerald:
      "bg-emerald-500/10 text-emerald-400",
    purple:
      "bg-purple-500/10 text-purple-400",
    amber:
      "bg-amber-500/10 text-amber-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          accents[accent]
        }`}
      >
        <Icon size={21} />
      </div>

      <p className="text-sm text-slate-500 mt-5">
        {label}
      </p>

      <p className="text-3xl font-bold mt-1">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MODULE CARD                                                                 */
/* -------------------------------------------------------------------------- */

function ModuleCard({
  module,
  index,
  lessons,
  actionLoading,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onTogglePublication,
}) {
  const publishedCount = lessons.filter(
    (lesson) => lesson.is_published
  ).length;

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/70 overflow-hidden hover:border-slate-700 transition">
      {/* MODULE HEADER */}

      <div className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-bold">
                {module.title}
              </h3>

              <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
                {lessons.length}{" "}
                {lessons.length === 1
                  ? "lesson"
                  : "lessons"}
              </span>
            </div>

            {module.description && (
              <p className="text-sm text-slate-500 mt-2 leading-6">
                {module.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
              <span>
                {publishedCount} published
              </span>

              <span>
                {lessons.length - publishedCount}{" "}
                draft
                {lessons.length - publishedCount === 1
                  ? ""
                  : "s"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEditModule}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition"
            >
              <Pencil size={15} />
              Edit
            </button>

            <button
              onClick={onDeleteModule}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-900/50 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-sm font-medium transition"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* LESSONS */}

      <div className="border-t border-slate-800 bg-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-6 py-4">
          <div>
            <p className="text-sm font-semibold">
              Lessons
            </p>

            <p className="text-xs text-slate-600 mt-1">
              Content inside this module.
            </p>
          </div>

          <button
            onClick={onAddLesson}
            disabled={actionLoading}
            className="w-fit flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-semibold transition"
          >
            <Plus size={15} />
            Add Lesson
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="px-5 sm:px-6 pb-6">
            <div className="rounded-2xl border border-dashed border-slate-800 p-7 text-center">
              <FileText
                size={26}
                className="mx-auto text-slate-700 mb-3"
              />

              <p className="text-sm text-slate-500">
                No lessons in this module yet.
              </p>

              <button
                onClick={onAddLesson}
                disabled={actionLoading}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Create Lesson
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 sm:px-6 pb-5">
            {lessons.map((lesson, lessonIndex) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                index={lessonIndex}
                actionLoading={actionLoading}
                onEdit={() =>
                  onEditLesson(lesson)
                }
                onDelete={() =>
                  onDeleteLesson(lesson)
                }
                onTogglePublication={() =>
                  onTogglePublication(lesson)
                }
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* LESSON ROW                                                                  */
/* -------------------------------------------------------------------------- */

function LessonRow({
  lesson,
  index,
  actionLoading,
  onEdit,
  onDelete,
  onTogglePublication,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 py-4 border-t border-slate-800">
      <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">
          {lesson.title}
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock3 size={12} />

            {lesson.duration_minutes
              ? `${lesson.duration_minutes} min`
              : "No duration"}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold ${
              lesson.is_published
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-slate-800 text-slate-500"
            }`}
          >
            {lesson.is_published ? (
              <CheckCircle2 size={11} />
            ) : (
              <Clock3 size={11} />
            )}

            {lesson.is_published
              ? "Published"
              : "Draft"}
          </span>

          {lesson.video_url && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-semibold">
              <Video size={11} />
              Video
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onEdit}
          disabled={actionLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          <Pencil size={13} />
          Edit
        </button>

        <button
          onClick={onTogglePublication}
          disabled={actionLoading}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
            lesson.is_published
              ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"
              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
          }`}
        >
          {lesson.is_published ? (
            <>
              <Clock3 size={13} />
              Unpublish
            </>
          ) : (
            <>
              <Rocket size={13} />
              Publish
            </>
          )}
        </button>

        <button
          onClick={onDelete}
          disabled={actionLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-semibold transition"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EMPTY STATE                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4">
        <Icon size={26} />
      </div>

      <h3 className="text-lg font-bold">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MODAL                                                                       */
/* -------------------------------------------------------------------------- */

function ModalOverlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}

function ModalHeader({
  eyebrow,
  title,
  onClose,
  disabled,
}) {
  return (
    <div className="flex items-start justify-between gap-5 p-6 sm:p-7 border-b border-slate-800">
      <div>
        <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
          {eyebrow}
        </p>

        <h2 className="text-2xl font-bold mt-1">
          {title}
        </h2>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function FormLabel({ children }) {
  return (
    <label className="block text-sm font-semibold text-slate-300 mb-2 mt-5">
      {children}
    </label>
  );
}

export default InstructorCourse;