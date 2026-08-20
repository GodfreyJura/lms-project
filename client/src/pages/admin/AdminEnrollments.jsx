import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import api from "../../services/api";

function AdminEnrollments() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError("");

      // Use the new /admin/enrollments endpoint
      const response = await api.get("/admin/enrollments");

      if (response.data.success) {
        setEnrollments(response.data.enrollments || []);
        setFilteredEnrollments(response.data.enrollments || []);
      } else {
        setError(response.data.message || "Failed to load enrollments");
      }
    } catch (err) {
      console.error("Fetch admin enrollments error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to load enrollments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  // Filter enrollments based on search and status
  useEffect(() => {
    let filtered = enrollments;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (enrollment) =>
          enrollment.first_name?.toLowerCase().includes(term) ||
          enrollment.last_name?.toLowerCase().includes(term) ||
          enrollment.course_title?.toLowerCase().includes(term) ||
          enrollment.email?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter(
        (enrollment) => enrollment.status === statusFilter
      );
    }

    setFilteredEnrollments(filtered);
  }, [searchTerm, statusFilter, enrollments]);

  const getStatusBadge = (status) => {
    const statusStyles = {
      ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      COMPLETED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      DROPPED: "bg-red-500/10 text-red-400 border-red-500/20",
      PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      ENROLLED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };

    const statusIcons = {
      ACTIVE: CheckCircle2,
      COMPLETED: CheckCircle2,
      DROPPED: XCircle,
      PENDING: Clock3,
      ENROLLED: CheckCircle2,
    };

    const Icon = statusIcons[status] || Clock3;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusStyles[status] || "bg-slate-800 text-slate-400 border-slate-700"}`}
      >
        <Icon size={13} />
        {status || "UNKNOWN"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold">Loading enrollments...</h2>
          <p className="text-slate-500 mt-2">Fetching enrollment data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-red-900/50 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-5">
            <RefreshCw size={28} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Unable to load enrollments</h2>
          <p className="text-red-400 mb-7">{error}</p>
          <button
            onClick={fetchEnrollments}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* HEADER */}
      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-2">
              Enrollment Management
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Enrollments
            </h1>
            <p className="text-slate-400 mt-2">
              Manage student course enrollments
            </p>
          </div>

          <button
            onClick={fetchEnrollments}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition text-sm font-medium"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      {/* FILTERS */}
      <section className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, email, or course..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {["ALL", "ENROLLED", "ACTIVE", "COMPLETED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                  statusFilter === status
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ENROLLMENTS TABLE */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        {filteredEnrollments.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
              <ClipboardList size={30} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-bold">No enrollments found</h3>
            <p className="text-slate-500 mt-2">
              {searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your search or filters."
                : "No enrollments have been recorded yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Student
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Course
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Enrolled
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                          {(enrollment.first_name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {enrollment.first_name} {enrollment.last_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {enrollment.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{enrollment.course_title}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(enrollment.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {enrollment.enrolled_at
                        ? new Date(enrollment.enrolled_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* COUNT */}
      <div className="mt-4 text-sm text-slate-500">
        Showing {filteredEnrollments.length} of {enrollments.length} enrollments
      </div>
    </>
  );
}

export default AdminEnrollments;