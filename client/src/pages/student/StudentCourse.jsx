import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  LogOut,
  Menu,
  PlayCircle,
  Trophy,
  X,
  Sparkles,
  GraduationCap,
  ChevronRight,
  FileText,
  ClipboardList,
} from "lucide-react";
import api from "../../services/api";

function StudentCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ------------------------------------------------------------
  // LOAD COURSE
  // ------------------------------------------------------------

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError("");

      const [courseResponse, progressResponse, quizzesResponse] =
        await Promise.all([
          api.get(`/student/courses/${courseId}`),
          api.get(`/progress/courses/${courseId}`),
          api.get(`/quizzes/courses/${courseId}/published`),
        ]);

      if (courseResponse.data.success) {
        setCourseData(courseResponse.data);
      }

      if (progressResponse.data.success) {
        setProgressData(progressResponse.data);
      }

      if (quizzesResponse.data.success) {
        setQuizzes(quizzesResponse.data.quizzes || []);
      }
    } catch (err) {
      console.error("Course loading error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message || "Unable to load course."
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // ALL LESSONS
  // ------------------------------------------------------------

  const allLessons = useMemo(() => {
    if (!courseData?.modules) {
      return [];
    }

    return courseData.modules.flatMap(
      (module) => module.lessons || []
    );
  }, [courseData]);

  // ------------------------------------------------------------
  // SELECTED LESSON INDEX
  // ------------------------------------------------------------

  const selectedLessonIndex = useMemo(() => {
    if (!selectedLesson) {
      return -1;
    }

    return allLessons.findIndex(
      (lesson) => lesson.id === selectedLesson.id
    );
  }, [allLessons, selectedLesson]);

  const previousLesson =
    selectedLessonIndex > 0
      ? allLessons[selectedLessonIndex - 1]
      : null;

  const nextLesson =
    selectedLessonIndex >= 0 &&
    selectedLessonIndex < allLessons.length - 1
      ? allLessons[selectedLessonIndex + 1]
      : null;

  // ------------------------------------------------------------
  // OPEN LESSON
  // ------------------------------------------------------------

  const handleLessonClick = async (lesson) => {
    if (!lesson) {
      return;
    }

    try {
      setLessonLoading(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/progress/lessons/${lesson.id}/start`
      );

      if (response.data.success) {
        const progress = response.data.progress || {};

        setSelectedLesson({
          ...lesson,
          completed: Boolean(progress.completed),
          completed_at: progress.completed_at || null,
          last_accessed_at: progress.last_accessed_at || null,
        });

        setSidebarOpen(false);
      }
    } catch (err) {
      console.error("Lesson start error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message || "Unable to open lesson."
      );
    } finally {
      setLessonLoading(false);
    }
  };

  // ------------------------------------------------------------
  // COMPLETE LESSON
  // ------------------------------------------------------------

  const handleCompleteLesson = async () => {
    if (!selectedLesson) {
      return;
    }

    try {
      setLessonLoading(true);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/progress/lessons/${selectedLesson.id}/complete`
      );

      if (response.data.success) {
        const progress = response.data.progress || {};

        setSelectedLesson((previous) => ({
          ...previous,
          completed: true,
          completed_at: progress.completed_at || new Date().toISOString(),
        }));

        setSuccess(
          nextLesson
            ? "Lesson completed successfully."
            : "Congratulations! You completed the final lesson."
        );

        const progressResponse = await api.get(
          `/progress/courses/${courseId}`
        );

        if (progressResponse.data.success) {
          setProgressData(progressResponse.data);
        }
      }
    } catch (err) {
      console.error("Complete lesson error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to complete lesson."
      );
    } finally {
      setLessonLoading(false);
    }
  };

  // ------------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ------------------------------------------------------------
  // YOUTUBE URL CONVERTER
  // ------------------------------------------------------------

  const getYouTubeEmbedUrl = (url) => {
    if (!url) {
      return null;
    }

    try {
      const trimmedUrl = url.trim();

      if (trimmedUrl.includes("youtube.com/watch")) {
        const parsedUrl = new URL(trimmedUrl);
        const videoId = parsedUrl.searchParams.get("v");

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      if (trimmedUrl.includes("youtu.be/")) {
        const parsedUrl = new URL(trimmedUrl);
        const videoId = parsedUrl.pathname
          .replace("/", "")
          .trim();

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      if (trimmedUrl.includes("youtube.com/embed/")) {
        return trimmedUrl;
      }

      if (trimmedUrl.includes("youtube.com/shorts/")) {
        const parsedUrl = new URL(trimmedUrl);
        const videoId = parsedUrl.pathname
          .split("/shorts/")[1]
          ?.split("/")[0];

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      return null;
    } catch (error) {
      console.error("Invalid YouTube URL:", error);
      return null;
    }
  };

  // ------------------------------------------------------------
  // LOADING SCREEN
  // ------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="relative mx-auto mb-6 w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-900/30">
              <GraduationCap size={30} />
            </div>
          </div>
          <h2 className="text-xl font-bold">
            Loading your course
          </h2>
          <p className="text-slate-500 mt-2">
            Preparing your learning experience...
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // COURSE ERROR
  // ------------------------------------------------------------

  if (error && !courseData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <X size={30} />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Unable to load course
          </h2>
          <p className="text-red-400 mt-3 mb-7">
            {error}
          </p>
          <button
            onClick={() => navigate("/student")}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // COURSE DATA
  // ------------------------------------------------------------

  const course = courseData?.course;
  const modules = courseData?.modules || [];
  const progress = progressData?.progress;

  const progressPercentage = Math.min(
    100,
    Math.max(
      0,
      Number(progress?.progress_percentage) || 0
    )
  );

  const completedLessons =
    progress?.completed_lessons ?? 0;

  const totalLessons =
    progress?.total_lessons ?? allLessons.length;

  const isCourseComplete =
    totalLessons > 0 &&
    completedLessons >= totalLessons;

  const youtubeEmbedUrl = selectedLesson?.video_url
    ? getYouTubeEmbedUrl(selectedLesson.video_url)
    : null;

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070b14]/80 backdrop-blur-2xl">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
          <button
            onClick={() => navigate("/student")}
            className="group flex items-center gap-2.5 text-slate-400 hover:text-white transition"
          >
            <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center group-hover:bg-white/[0.08] transition">
              <ArrowLeft size={17} />
            </div>
            <span className="hidden sm:block font-medium">
              Dashboard
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-400">
              <BookOpen size={16} className="text-blue-400" />
              Learning Mode
            </div>

            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
            >
              <LogOut size={17} className="group-hover:text-red-400 transition" />
              <span className="hidden sm:block text-sm font-medium">
                Logout
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          COURSE HERO
      ===================================================== */}

      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/70 via-[#070b14] to-indigo-950/50" />
        <div className="absolute -top-40 -right-32 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-[20%] w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[120px]" />

        <div className="relative max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-5xl">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
              <span>My Learning</span>
              <ChevronRight size={14} />
              <span className="text-blue-400">Course</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-5">
              <Sparkles size={14} />
              Course
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.05]">
              {course?.title || "Untitled Course"}
            </h1>

            <p className="mt-5 max-w-3xl text-slate-400 text-base sm:text-lg leading-8">
              {course?.description ||
                "Continue your learning journey and master the concepts in this course."}
            </p>

            {/* Progress card */}
            <div className="mt-9 max-w-3xl rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Your progress
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Keep going — you're making progress.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">
                    {progressPercentage}%
                  </span>
                </div>
              </div>

              <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  {completedLessons} completed
                </span>
                <span>{totalLessons} total lessons</span>
                {isCourseComplete && (
                  <span className="flex items-center gap-2 text-amber-400 font-medium">
                    <Trophy size={15} />
                    Course completed
                  </span>
                )}
              </div>
            </div>

            {/* QUIZZES */}
            {quizzes.length > 0 && (
              <div className="mt-6 max-w-3xl rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl p-5 sm:p-6">
                <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <ClipboardList size={16} className="text-blue-400" />
                  Quizzes
                </p>

                <div className="space-y-3">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {quiz.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {quiz.attempt_count}/{quiz.max_attempts} attempts used
                          {quiz.time_limit_minutes && ` • ${quiz.time_limit_minutes} min`}
                        </p>
                      </div>

                      {quiz.can_attempt ? (
                        <button
                          onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition text-sm"
                        >
                          <FileText size={15} />
                          {quiz.attempt_count > 0 ? "Retake" : "Start"}
                        </button>
                      ) : (
                        <span className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-500 text-sm font-medium">
                          Max attempts reached
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          MOBILE COURSE CONTENT BUTTON
      ===================================================== */}

      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-950/50 flex items-center justify-center transition hover:scale-105"
        aria-label="Open course content"
      >
        <Menu size={23} />
      </button>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
            <X size={19} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-emerald-300">
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-[370px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)] gap-8">
          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside
            className={`
              fixed lg:sticky
              top-0 lg:top-24
              left-0
              z-50 lg:z-auto
              h-screen lg:h-auto
              w-[350px] sm:w-[380px] lg:w-auto
              transform
              transition-transform
              duration-300
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
              overflow-y-auto
              lg:max-h-[calc(100vh-120px)]
              pr-0 lg:pr-1
            `}
          >
            <div className="bg-[#0c1220] border border-white/[0.07] rounded-none lg:rounded-2xl overflow-hidden shadow-2xl">
              <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div>
                  <p className="font-bold">Course Content</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {allLessons.length} lessons
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center"
                  aria-label="Close course content"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="hidden lg:block p-5 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg">Course Content</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Work through each lesson at your pace.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/10 text-blue-400 text-xs font-bold">
                    {allLessons.length}
                  </span>
                </div>
              </div>

              <div>
                {modules.length === 0 ? (
                  <div className="p-8 text-center">
                    <BookOpen size={30} className="mx-auto text-slate-700 mb-3" />
                    <p className="text-slate-500">No modules available.</p>
                  </div>
                ) : (
                  modules.map((module, moduleIndex) => (
                    <div
                      key={module.id}
                      className="border-b border-white/[0.05] last:border-0"
                    >
                      <div className="px-5 py-4 bg-white/[0.015]">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-black">
                            {String(moduleIndex + 1).padStart(2, "0")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">
                              Module {moduleIndex + 1}
                            </p>
                            <h3 className="font-semibold text-sm text-slate-200 mt-1">
                              {module.title}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {!module.lessons || module.lessons.length === 0 ? (
                        <div className="px-5 py-4 text-xs text-slate-600 italic">
                          No published lessons yet.
                        </div>
                      ) : (
                        module.lessons.map((lesson) => {
                          const active = selectedLesson?.id === lesson.id;

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonClick(lesson)}
                              disabled={lessonLoading}
                              className={`
                                group w-full text-left px-5 py-4
                                border-t border-white/[0.04] transition-all duration-200
                                ${active ? "bg-blue-500/[0.08]" : "hover:bg-white/[0.035]"}
                                disabled:opacity-50
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`
                                    w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition
                                    ${lesson.completed
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : active
                                      ? "bg-blue-500/15 text-blue-400"
                                      : "bg-slate-800/80 text-slate-500 group-hover:text-slate-300"}
                                  `}
                                >
                                  {lesson.completed ? (
                                    <Check size={15} />
                                  ) : (
                                    <PlayCircle size={17} />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-semibold truncate ${active ? "text-blue-400" : "text-slate-300 group-hover:text-white"}`}>
                                    {lesson.title}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600">
                                    <Clock3 size={11} />
                                    {lesson.duration_minutes ? `${lesson.duration_minutes} min` : "Lesson"}
                                    {lesson.completed && (
                                      <>
                                        <span>•</span>
                                        <span className="text-emerald-500">Completed</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <ChevronRight size={15} className={`shrink-0 transition ${active ? "text-blue-400 translate-x-0.5" : "text-slate-700"}`} />
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* =================================================
              LESSON VIEWER
          ================================================= */}

          <section>
            {!selectedLesson ? (
              <div className="min-h-[560px] rounded-3xl border border-white/[0.07] bg-[#0c1220] flex items-center justify-center p-8 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-indigo-500/[0.04]" />
                <div className="relative text-center max-w-lg">
                  <div className="relative mx-auto mb-7 w-24 h-24">
                    <div className="absolute inset-0 rounded-3xl bg-blue-500/20 blur-2xl" />
                    <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                      <PlayCircle size={45} />
                    </div>
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-400 font-bold mb-3">
                    Learning starts here
                  </p>
                  <h2 className="text-3xl font-black mb-4">Ready to learn?</h2>
                  <p className="text-slate-500 leading-7 max-w-md mx-auto">
                    Choose a lesson from the course content or jump straight into the first lesson.
                  </p>
                  {allLessons.length > 0 && (
                    <button
                      onClick={() => handleLessonClick(allLessons[0])}
                      disabled={lessonLoading}
                      className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-bold shadow-xl shadow-blue-950/30 transition hover:-translate-y-0.5"
                    >
                      <PlayCircle size={19} />
                      Start First Lesson
                      <ArrowRight size={17} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/[0.07] bg-[#0c1220] overflow-hidden shadow-2xl">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span>Lesson {selectedLessonIndex + 1}</span>
                      <span className="text-slate-700">/</span>
                      <span>{allLessons.length}</span>
                    </div>
                    {selectedLesson.completed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 size={14} />
                        Completed
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                    {selectedLesson.title}
                  </h2>

                  {selectedLesson.duration_minutes && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                      <Clock3 size={16} />
                      {selectedLesson.duration_minutes} minutes
                    </div>
                  )}
                </div>

                {selectedLesson.video_url ? (
                  <div className="bg-black aspect-video border-y border-white/[0.06]">
                    {youtubeEmbedUrl ? (
                      <iframe
                        className="w-full h-full"
                        src={youtubeEmbedUrl}
                        title={selectedLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        controls
                        playsInline
                        className="w-full h-full"
                        src={selectedLesson.video_url}
                      >
                        Your browser does not support the video player.
                      </video>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-[#080c15] border-y border-white/[0.06] flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mx-auto mb-4">
                        <PlayCircle size={30} className="text-slate-700" />
                      </div>
                      <p className="text-slate-600 text-sm">
                        No video available for this lesson
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="max-w-4xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <BookOpen size={17} />
                      </div>
                      <h3 className="text-lg font-bold">Lesson Content</h3>
                    </div>
                    <div className="text-slate-300 leading-8 whitespace-pre-wrap text-[15px] sm:text-base">
                      {selectedLesson.content || "No lesson content has been added yet."}
                    </div>
                  </div>

                  <div className="mt-10">
                    {selectedLesson.completed ? (
                      <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-5 sm:p-6 flex items-start gap-4">
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Check size={21} />
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-300">Lesson completed</h4>
                          <p className="text-sm text-emerald-400/60 mt-1">
                            Great work. Keep going with the next lesson.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleCompleteLesson}
                        disabled={lessonLoading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5"
                      >
                        <CheckCircle2 size={19} />
                        {lessonLoading ? "Saving..." : "Mark Lesson as Complete"}
                      </button>
                    )}
                  </div>

                  <div className="mt-10 pt-7 border-t border-white/[0.06] flex items-center justify-between gap-4">
                    <button
                      onClick={() => previousLesson && handleLessonClick(previousLesson)}
                      disabled={!previousLesson || lessonLoading}
                      className="group inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition"
                    >
                      <ArrowLeft size={17} className="group-hover:-translate-x-0.5 transition" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    {nextLesson ? (
                      <button
                        onClick={() => handleLessonClick(nextLesson)}
                        disabled={lessonLoading}
                        className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-bold shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5"
                      >
                        <span>Next Lesson</span>
                        <ArrowRight size={17} className="group-hover:translate-x-0.5 transition" />
                      </button>
                    ) : selectedLesson.completed ? (
                      <button
                        onClick={() => navigate("/student")}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5"
                      >
                        <Trophy size={18} />
                        Finish Course
                      </button>
                    ) : (
                      <span className="text-sm text-slate-600">Final lesson</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default StudentCourse;