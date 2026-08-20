import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Building2,
  RefreshCw,
  User,
  Users,
  BookOpen,
  GraduationCap,
  Shield,
} from "lucide-react";
import api from "../../services/api";

function AdminSettings() {
  const navigate = useNavigate();
  const [institution, setInstitution] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");

      // Use /admin/dashboard which includes institution info and statistics
      const response = await api.get("/admin/dashboard");

      if (response.data.success) {
        setInstitution(response.data.institution || null);
        setStatistics(response.data.statistics || null);
      } else {
        setError(response.data.message || "Failed to load settings");
      }
    } catch (err) {
      console.error("Fetch admin settings error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold">Loading settings...</h2>
          <p className="text-slate-500 mt-2">Fetching institution settings</p>
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
          <h2 className="text-2xl font-bold mb-3">Unable to load settings</h2>
          <p className="text-red-400 mb-7">{error}</p>
          <button
            onClick={fetchSettings}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const userStats = statistics?.users || {};

  return (
    <>
      {/* HEADER */}
      <section className="mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-2">
            Institution Settings
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-slate-400 mt-2">
            View your institution information
          </p>
        </div>
      </section>

      {/* INSTITUTION INFO */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-800">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Building2 size={18} className="text-blue-400" />
            Institution Information
          </h3>
        </div>

        <div className="p-6">
          {institution ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Institution Name</p>
                <p className="text-lg font-semibold mt-1">
                  {institution.name || "Not set"}
                </p>
              </div>

              {institution.email && (
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="text-lg font-semibold mt-1">
                    {institution.email}
                  </p>
                </div>
              )}

              {institution.address && (
                <div>
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="text-lg font-semibold mt-1">
                    {institution.address}
                  </p>
                </div>
              )}

              {institution.created_at && (
                <div>
                  <p className="text-sm text-slate-500">Established</p>
                  <p className="text-lg font-semibold mt-1">
                    {new Date(institution.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500">No institution information available.</p>
          )}
        </div>
      </section>

      {/* INSTITUTION STATS */}
      <section className="mb-8">
        <h3 className="font-semibold text-lg mb-4">Institution Statistics</h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <Users size={21} />
            </div>
            <p className="text-sm text-slate-500">Total Users</p>
            <p className="text-3xl font-bold mt-1">{userStats.total_users ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <GraduationCap size={21} />
            </div>
            <p className="text-sm text-slate-500">Instructors</p>
            <p className="text-3xl font-bold mt-1">{userStats.total_instructors ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <BookOpen size={21} />
            </div>
            <p className="text-sm text-slate-500">Students</p>
            <p className="text-3xl font-bold mt-1">{userStats.total_students ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Shield size={21} />
            </div>
            <p className="text-sm text-slate-500">Admins</p>
            <p className="text-3xl font-bold mt-1">{userStats.total_admins ?? 0}</p>
          </div>
        </div>
      </section>

      {/* ADMIN PROFILE */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <User size={18} className="text-purple-400" />
          Admin Profile
        </h3>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xl">
            A
          </div>

          <div>
            <p className="font-semibold">Administrator</p>
            <p className="text-sm text-slate-500">admin@lms.com</p>
            <p className="text-xs text-slate-600 mt-1">Role: ADMIN</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default AdminSettings;