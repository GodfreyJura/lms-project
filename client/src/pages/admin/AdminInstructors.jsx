import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Search,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import api from "../../services/api";

function AdminInstructors() {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState([]);
  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      setError("");

      // Use the new /admin/instructors endpoint
      const response = await api.get("/admin/instructors");

      if (response.data.success) {
        setInstructors(response.data.instructors || []);
        setFilteredInstructors(response.data.instructors || []);
      } else {
        setError(response.data.message || "Failed to load instructors");
      }
    } catch (err) {
      console.error("Fetch admin instructors error:", err);

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
    fetchInstructors();
  }, []);

  // Filter instructors based on search
  useEffect(() => {
    let filtered = instructors;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (instructor) =>
          instructor.first_name?.toLowerCase().includes(term) ||
          instructor.last_name?.toLowerCase().includes(term) ||
          instructor.email?.toLowerCase().includes(term)
      );
    }

    setFilteredInstructors(filtered);
  }, [searchTerm, instructors]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold">Loading instructors...</h2>
          <p className="text-slate-500 mt-2">Fetching instructor data</p>
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
          <h2 className="text-2xl font-bold mb-3">Unable to load instructors</h2>
          <p className="text-red-400 mb-7">{error}</p>
          <button
            onClick={fetchInstructors}
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
              Instructor Management
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Instructors
            </h1>
            <p className="text-slate-400 mt-2">
              Manage instructors in your institution
            </p>
          </div>

          <button
            onClick={fetchInstructors}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition text-sm font-medium"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      {/* SEARCH */}
      <section className="mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
      </section>

      {/* INSTRUCTORS GRID */}
      <section>
        {filteredInstructors.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
              <GraduationCap size={30} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-bold">No instructors found</h3>
            <p className="text-slate-500 mt-2">
              {searchTerm
                ? "Try adjusting your search."
                : "No instructors have been added yet."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden hover:border-slate-700 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/10"
              >
                {/* CARD HEADER */}
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950">
                  <div className="absolute -right-8 -top-12 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
                </div>

                {/* CARD BODY */}
                <div className="p-6 -mt-12 relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-2xl border-4 border-slate-900 mx-auto mb-4 shadow-xl">
                    {(instructor.first_name || "I").charAt(0).toUpperCase()}
                    {(instructor.last_name || "").charAt(0).toUpperCase()}
                  </div>

                  <h3 className="text-lg font-bold text-center">
                    {instructor.first_name} {instructor.last_name}
                  </h3>

                  <p className="text-sm text-slate-500 text-center mt-1">
                    {instructor.email}
                  </p>

                  {/* STATUS */}
                  <div className="flex items-center justify-center mt-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        instructor.is_active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {instructor.is_active ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <XCircle size={13} />
                      )}
                      {instructor.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* METRICS */}
                  <div className="grid grid-cols-2 border-t border-slate-800 mt-5 pt-5">
                    <div className="text-center">
                      <BookOpen size={16} className="mx-auto text-slate-600 mb-1" />
                      <p className="text-lg font-bold">{instructor.total_courses ?? 0}</p>
                      <p className="text-[10px] text-slate-600">Courses</p>
                    </div>
                    <div className="text-center">
                      <GraduationCap size={16} className="mx-auto text-slate-600 mb-1" />
                      <p className="text-lg font-bold">{instructor.total_students ?? 0}</p>
                      <p className="text-[10px] text-slate-600">Students</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* COUNT */}
      <div className="mt-4 text-sm text-slate-500">
        Showing {filteredInstructors.length} of {instructors.length} instructors
      </div>
    </>
  );
}

export default AdminInstructors;