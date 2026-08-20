import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Search,
  Shield,
  User,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Settings,
} from "lucide-react";
import api from "../../services/api";

function AdminAuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/audit-logs?limit=200");

      if (response.data.success) {
        setLogs(response.data.audit_logs || []);
        setFilteredLogs(response.data.audit_logs || []);
      } else {
        setError(response.data.message || "Failed to load audit logs");
      }
    } catch (err) {
      console.error("Fetch audit logs error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs based on search
  useEffect(() => {
    let filtered = logs;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action?.toLowerCase().includes(term) ||
          log.resource_type?.toLowerCase().includes(term) ||
          log.first_name?.toLowerCase().includes(term) ||
          log.last_name?.toLowerCase().includes(term) ||
          log.email?.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  }, [searchTerm, logs]);

  const getActionBadge = (action) => {
    const actionStyles = {
      CREATE_USER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      UPDATE_USER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      DEACTIVATE_USER: "bg-red-500/10 text-red-400 border-red-500/20",
      REACTIVATE_USER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      CREATE_COURSE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      DELETE_COURSE: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${actionStyles[action] || "bg-slate-800 text-slate-400 border-slate-700"}`}
      >
        {action || "UNKNOWN"}
      </span>
    );
  };

  const getResourceIcon = (resourceType) => {
    switch (resourceType) {
      case "USER":
        return User;
      case "COURSE":
        return BookOpen;
      case "INSTRUCTOR":
        return GraduationCap;
      case "ENROLLMENT":
        return ClipboardList;
      case "SETTINGS":
        return Settings;
      default:
        return Shield;
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
          <h2 className="text-xl font-semibold">Loading audit logs...</h2>
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
          <h2 className="text-2xl font-bold mb-3">Unable to load audit logs</h2>
          <p className="text-red-400 mb-7">{error}</p>
          <button
            onClick={fetchLogs}
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
              Security
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Audit Logs
            </h1>
            <p className="text-slate-400 mt-2">
              Track administrative actions and changes
            </p>
          </div>

          <button
            onClick={fetchLogs}
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
            placeholder="Search by action, user, or resource..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
      </section>

      {/* LOGS TABLE */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
              <Shield size={30} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-bold">No audit logs found</h3>
            <p className="text-slate-500 mt-2">
              Administrative actions will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Action
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    User
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Resource
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    IP Address
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLogs.map((log) => {
                  const ResourceIcon = getResourceIcon(log.resource_type);

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                            {(log.first_name || "A").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {log.first_name} {log.last_name}
                            </p>
                            <p className="text-xs text-slate-500">{log.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ResourceIcon size={16} className="text-slate-500" />
                          <span className="text-slate-300">{log.resource_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {log.ip_address || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* COUNT */}
      <div className="mt-4 text-sm text-slate-500">
        Showing {filteredLogs.length} of {logs.length} logs
      </div>
    </>
  );
}

export default AdminAuditLogs;