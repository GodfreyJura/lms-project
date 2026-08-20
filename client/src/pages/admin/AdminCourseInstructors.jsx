import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import api from "../../services/api";

function AdminCourseInstructors() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [assignedInstructors, setAssignedInstructors] = useState([]);
  const [availableInstructors, setAvailableInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Get assigned instructors for this course
      const assignedResponse = await api.get(
        `/admin/courses/${courseId}/instructors`
      );

      // Get all instructors in the institution
      const allInstructorsResponse = await api.get("/admin/instructors");

      if (assignedResponse.data.success) {
        setCourse(assignedResponse.data.course);
        setAssignedInstructors(assignedResponse.data.instructors || []);
      }

      if (allInstructorsResponse.data.success) {
        const allInstructors = allInstructorsResponse.data.instructors || [];
        const assignedIds = new Set(
          (assignedResponse.data.instructors || []).map((i) => i.id)
        );

        // Filter out already assigned instructors
        const available = allInstructors.filter(
          (instructor) => !assignedIds.has(instructor.id) && instructor.is_active
        );

        setAvailableInstructors(available);
      }
    } catch (err) {
      console.error("Fetch instructors error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to load instructors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const handleAssignInstructor = async () => {
    if (!selectedInstructor) {
      setError("Please select an instructor to assign.");
      return;
    }

    try {
      setAssigning(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/admin/courses/${courseId}/instructors`,
        { instructor_id: selectedInstructor }
      );

      if (response.data.success) {
        setSuccess(
          `Instructor assigned successfully: ${response.data.assignment.instructor.first_name} ${response.data.assignment.instructor.last_name}`
        );
        setSelectedInstructor("");
        await fetchData();
      } else {
        setError(response.data.message || "Failed to assign instructor");
      }
    } catch (err) {
      console.error("Assign instructor error:", err);
      setError(err.response?.data?.message || "Unable to assign instructor");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveInstructor = async (instructor) => {
    const confirmed = window.confirm(
      `Remove ${instructor.first_name} ${instructor.last_name} from this course?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/admin/courses/${courseId}/instructors/${instructor.id}`
      );

      if (response.data.success) {
        setSuccess("Instructor removed successfully.");
        await fetchData();
      } else {
        setError(response.data.message || "Failed to remove instructor");
      }
    } catch (err) {
      console.error("Remove instructor error:", err);
      setError(err.response?.data?.message || "Unable to remove instructor");
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
          <h2 className="text-xl font-semibold">Loading instructors...</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(`/admin/courses/${courseId}`)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
      >
        <ArrowLeft size={17} />
        Back to Course
      </button>

      {/* HEADER */}
      <section className="mb-8">
        <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-2">
          Instructor Assignment
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {course?.title || "Course"} — Instructors
        </h1>
        <p className="text-slate-400 mt-2">
          Assign or remove instructors for this course
        </p>
      </section>

      {/* ALERTS */}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-emerald-300">
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
          <XCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {/* ASSIGN INSTRUCTOR */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Plus size={18} className="text-blue-400" />
          Assign Instructor
        </h3>

        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer"
          >
            <option value="" className="bg-slate-800">
              Select an instructor...
            </option>
            {availableInstructors.map((instructor) => (
              <option
                key={instructor.id}
                value={instructor.id}
                className="bg-slate-800"
              >
                {instructor.first_name} {instructor.last_name} ({instructor.email})
              </option>
            ))}
          </select>

          <button
            onClick={handleAssignInstructor}
            disabled={assigning || !selectedInstructor}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-50"
          >
            <Plus size={17} />
            {assigning ? "Assigning..." : "Assign"}
          </button>
        </div>

        {availableInstructors.length === 0 && (
          <p className="text-sm text-slate-500 mt-3">
            No available instructors to assign.
          </p>
        )}
      </section>

      {/* ASSIGNED INSTRUCTORS */}
      <section>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <GraduationCap size={18} className="text-purple-400" />
          Assigned Instructors ({assignedInstructors.length})
        </h3>

        {assignedInstructors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
            <GraduationCap size={30} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500">
              No instructors assigned to this course yet.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {assignedInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex items-center justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                    {(instructor.first_name || "I").charAt(0).toUpperCase()}
                    {(instructor.last_name || "").charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {instructor.first_name} {instructor.last_name}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {instructor.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveInstructor(instructor)}
                  className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition flex-shrink-0"
                  title="Remove instructor"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default AdminCourseInstructors;