import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Save,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  GraduationCap,
  Shield,
} from "lucide-react";
import api from "../../services/api";

// Role IDs from your Register page
const ROLES = {
  STUDENT: "59f15df3-c139-42ed-ab67-8e74daa1d44f",
  INSTRUCTOR: "73734d26-9d02-4319-becb-9f736153e6e2",
  ADMIN: "d599cd3f-defb-4408-b1fb-4d7b2401309d",
};

function AdminUserEdit() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role_id: "",
    is_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/admin/users/${userId}`);

      if (response.data.success) {
        const user = response.data.user;
        setForm({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          password: "",
          role_id: user.role_id || "",
          is_active: user.is_active,
        });
      } else {
        setError(response.data.message || "Failed to load user");
      }
    } catch (err) {
      console.error("Fetch user error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to load user");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First name and last name are required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        role_id: form.role_id,
      };

      // Only include password if it was entered
      if (form.password) {
        if (form.password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setSaving(false);
          return;
        }
        payload.password = form.password;
      }

      const response = await api.put(`/admin/users/${userId}`, payload);

      if (response.data.success) {
        setMessage("User updated successfully!");

        setTimeout(() => {
          navigate("/admin/users");
        }, 1500);
      } else {
        setError(response.data.message || "Failed to update user");
      }
    } catch (err) {
      console.error("Update user error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Unable to update user");
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
          <h2 className="text-xl font-semibold">Loading user...</h2>
          <p className="text-slate-500 mt-2">Fetching user data</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/admin/users")}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
      >
        <ArrowLeft size={17} />
        Back to Users
      </button>

      {/* HEADER */}
      <section className="mb-8">
        <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-2">
          User Management
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Edit User
        </h1>
        <p className="text-slate-400 mt-2">
          Update user information
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
            <User size={18} className="text-blue-400" />
            User Information
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Update the user's details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="e.g. John"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="e.g. Doe"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email *
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. john.doe@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            {/* Password (optional) */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                New Password (optional)
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Account Type *
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Student */}
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, role_id: ROLES.STUDENT })
                  }
                  className={`p-4 rounded-xl border transition ${
                    form.role_id === ROLES.STUDENT
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <User size={22} className="mx-auto mb-2" />
                  <p className="font-semibold text-center">Student</p>
                </button>

                {/* Instructor */}
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, role_id: ROLES.INSTRUCTOR })
                  }
                  className={`p-4 rounded-xl border transition ${
                    form.role_id === ROLES.INSTRUCTOR
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <GraduationCap size={22} className="mx-auto mb-2" />
                  <p className="font-semibold text-center">Instructor</p>
                </button>

                {/* Admin */}
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, role_id: ROLES.ADMIN })
                  }
                  className={`p-4 rounded-xl border transition ${
                    form.role_id === ROLES.ADMIN
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Shield size={22} className="mx-auto mb-2" />
                  <p className="font-semibold text-center">Administrator</p>
                </button>
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
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

export default AdminUserEdit;