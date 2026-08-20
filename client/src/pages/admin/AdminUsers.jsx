import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Pencil,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  GraduationCap,
  Shield,
} from "lucide-react";
import api from "../../services/api";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/users");

      if (response.data.success) {
        setUsers(response.data.users || []);
        setFilteredUsers(response.data.users || []);
      } else {
        setError(response.data.message || "Failed to load users");
      }
    } catch (err) {
      console.error("Fetch admin users error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.first_name?.toLowerCase().includes(term) ||
          user.last_name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term)
      );
    }

    if (roleFilter !== "ALL") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const getRoleBadge = (role) => {
    const roleStyles = {
      ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
      INSTRUCTOR: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      STUDENT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };

    const roleIcons = {
      ADMIN: Shield,
      INSTRUCTOR: GraduationCap,
      STUDENT: User,
    };

    const Icon = roleIcons[role] || User;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${roleStyles[role]}`}
      >
        <Icon size={13} />
        {role}
      </span>
    );
  };

  const handleToggleStatus = async (user) => {
    const action = user.is_active ? "deactivate" : "activate";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.first_name} ${user.last_name}?`
    );

    if (!confirmed) return;

    try {
      if (user.is_active) {
        // Deactivate user
        await api.delete(`/admin/users/${user.id}`);
      } else {
        // Reactivate user
        await api.patch(`/admin/users/${user.id}/reactivate`);
      }

      await fetchUsers();
    } catch (err) {
      console.error("Toggle user status error:", err);
      alert(err.response?.data?.message || `Unable to ${action} user`);
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
          <h2 className="text-xl font-semibold">Loading users...</h2>
          <p className="text-slate-500 mt-2">Fetching user management data</p>
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
          <h2 className="text-2xl font-bold mb-3">Unable to load users</h2>
          <p className="text-red-400 mb-7">{error}</p>
          <button
            onClick={fetchUsers}
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
              User Management
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Users
            </h1>
            <p className="text-slate-400 mt-2">
              Manage all users in your institution
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition text-sm font-medium"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => navigate("/admin/users/create")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-900/20"
            >
              <Plus size={17} />
              Add User
            </button>
          </div>
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
              placeholder="Search by name or email..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          {/* Role Filter */}
          <div className="flex gap-2">
            {["ALL", "STUDENT", "INSTRUCTOR", "ADMIN"].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                  roleFilter === role
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {role === "ALL" ? "All" : role.charAt(0) + role.slice(1).toLowerCase() + "s"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* USERS TABLE */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
              <Users size={30} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-bold">No users found</h3>
            <p className="text-slate-500 mt-2">
              {searchTerm || roleFilter !== "ALL"
                ? "Try adjusting your search or filters."
                : "No users have been created yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    User
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Role
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Joined
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                          {user.first_name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          user.is_active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {user.is_active ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <XCircle size={13} />
                        )}
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          title="Edit user"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-lg transition ${
                            user.is_active
                              ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                          }`}
                          title={user.is_active ? "Deactivate" : "Activate"}
                        >
                          {user.is_active ? (
                            <XCircle size={15} />
                          ) : (
                            <CheckCircle2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* USER COUNT */}
      <div className="mt-4 text-sm text-slate-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </>
  );
}

export default AdminUsers;