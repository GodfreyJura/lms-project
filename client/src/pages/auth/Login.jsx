import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  Lock,
  Building2,
  LogIn,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    institution_id: "975cfbae-550f-43d6-b695-612905bcd52e",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);

      console.log("Login response:", response.data);

      const { token, user } = response.data;

      if (!token || !user) {
        setMessage("Login failed: invalid server response.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setMessage("Login successful!");

      if (user.role === "ADMIN") {
        navigate("/admin");
      } else if (user.role === "INSTRUCTOR") {
        navigate("/instructor");
      } else if (user.role === "STUDENT") {
        navigate("/student");
      } else {
        setMessage("Login successful, but the account role is unknown.");
      }
    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        error.response?.data?.message ||
        "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute top-[40%] -left-40 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-[20%] w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      {/* LOGIN CARD */}
      <div className="relative w-full max-w-md">
        {/* LOGO */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap size={28} />
            </div>
          </div>

          <h1 className="text-3xl font-bold mt-6">Learning Management System</h1>
          <p className="text-slate-500 mt-2">
            Sign in to your LMS account
          </p>
        </div>

        {/* CARD */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-7 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit}>
            {/* Institution ID */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Institution ID
              </label>

              <div className="relative">
                <Building2
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  name="institution_id"
                  value={formData.institution_id}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn size={18} />
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </form>

          {/* Message */}
          {message && (
            <div
              className={`mt-5 p-4 rounded-xl text-sm font-medium ${
                message.includes("success")
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Register Link */}
        <p className="text-center text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            Register here
          </Link>
        </p>

        {/* Sparkle Badge */}
        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-slate-600">
          <Sparkles size={14} />
          Learning Management System
        </div>
      </div>
    </div>
  );
}

export default Login;