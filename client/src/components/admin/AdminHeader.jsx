function AdminHeader() {
  const userData = localStorage.getItem("user");

  let user = null;

  try {
    user = userData ? JSON.parse(userData) : null;
  } catch {
    user = null;
  }

  const fullName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : "Administrator";

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Administration
        </h2>

        <p className="text-sm text-slate-500">
          Manage your learning management system
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">
            {fullName || "Administrator"}
          </p>

          <p className="text-xs text-slate-500">
            Administrator
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          {(user?.first_name?.[0] || "A").toUpperCase()}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;