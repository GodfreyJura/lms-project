import { NavLink } from "react-router-dom";

function AdminSidebar() {
  const navigation = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: "▦",
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: "◉",
    },
    {
      name: "Courses",
      path: "/admin/courses",
      icon: "▤",
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Logo */}
      <div className="h-20 px-6 flex items-center border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold">LMS Admin</h1>
          <p className="text-xs text-slate-400 mt-1">
            Administration Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Management
        </p>

        <div className="space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span className="w-6 text-center">{item.icon}</span>

              <span className="font-medium">
                {item.name}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="px-4 py-3 rounded-lg bg-slate-900">
          <p className="text-sm font-medium">
            Administrator
          </p>

          <p className="text-xs text-slate-500 mt-1">
            LMS Management
          </p>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;