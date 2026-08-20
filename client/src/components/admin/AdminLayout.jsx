import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/courses", icon: BookOpen, label: "Courses" },
    { to: "/admin/instructors", icon: GraduationCap, label: "Instructors" },
    { to: "/admin/enrollments", icon: ClipboardList, label: "Enrollments" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
    { to: "/admin/audit-logs", icon: Shield, label: "Audit Logs" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute top-[40%] -left-40 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-72
          bg-slate-900/95 backdrop-blur-xl border-r border-slate-800
          transform transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col">
          {/* LOGO */}
          <div className="px-6 py-7 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <LayoutDashboard size={24} />
              </div>

              <div>
                <h1 className="font-bold text-lg">LMS Admin</h1>
                <p className="text-xs text-slate-500">Administration Portal</p>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto lg:hidden text-slate-400 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 mb-3">
              Main Menu
            </p>

            <div className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      isActive
                        ? "bg-blue-600/10 text-blue-400 border border-blue-500/10"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          {/* ADMIN PROFILE */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                A
              </div>

              <div className="min-w-0">
                <p className="font-medium truncate">Administrator</p>
                <p className="text-xs text-slate-500 truncate">ADMIN</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
            >
              <LogOut size={19} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="lg:ml-72 min-h-screen relative">
        {/* TOP BAR */}
        <header className="h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="h-full px-5 sm:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <Menu size={25} />
              </button>

              <div className="hidden lg:block">
                <p className="text-sm text-slate-500">Admin Portal</p>
                <p className="font-medium text-slate-200">
                  Manage your learning management system
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">Administrator</p>
                <p className="text-xs text-slate-500">admin@lms.com</p>
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-5 sm:p-8 lg:p-10 max-w-[1600px] mx-auto relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;