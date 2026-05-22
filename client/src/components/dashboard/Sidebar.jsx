import { useAuth } from "../../context/AuthContext";
import { useNavigate, NavLink } from "react-router-dom";
import {
  FaUsers,
  FaTasks,
  FaProjectDiagram,
  FaMoneyBill,
  FaChartBar,
  FaFileAlt,
  FaClipboardList,
  FaSignOutAlt,
  FaUser,
  FaTimes,
  FaCheckDouble,
} from "react-icons/fa";
import { motion } from "framer-motion";

const menuConfigs = {
  ADMIN: [
    { name: "Dashboard", path: "/admin", icon: <FaChartBar /> },
    { name: "Users", path: "/admin/users", icon: <FaUsers /> },
    { name: "Projects", path: "/admin/projects", icon: <FaProjectDiagram /> },
    { name: "Tasks", path: "/admin/tasks", icon: <FaTasks /> },
    { name: "Expenses", path: "/admin/expenses", icon: <FaMoneyBill /> },
    { name: "Reports", path: "/admin/reports", icon: <FaFileAlt /> },
    { name: "Audit Logs", path: "/admin/audit-logs", icon: <FaClipboardList /> },
  ],
  MANAGER: [
    { name: "Dashboard", path: "/manager", icon: <FaChartBar /> },
    { name: "Projects", path: "/manager/projects", icon: <FaProjectDiagram /> },
    { name: "Tasks", path: "/manager/tasks", icon: <FaTasks /> },
    { name: "Expenses", path: "/manager/expenses", icon: <FaMoneyBill /> },
  ],
  EMPLOYEE: [
    { name: "Dashboard", path: "/employee", icon: <FaChartBar /> },
    { name: "My Tasks", path: "/employee/tasks", icon: <FaTasks /> },
    { name: "My Expenses", path: "/employee/expenses", icon: <FaMoneyBill /> },
    { name: "My Profile", path: "/employee/profile", icon: <FaUser /> },
  ],
};

function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || "EMPLOYEE";
  const items = menuConfigs[role] || menuConfigs.EMPLOYEE;

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate("/login");
  };

  return (
    <aside className="w-72 h-screen flex flex-col justify-between p-6 bg-slate-950/80 border-r border-white/5 backdrop-blur-xl">
      <div>
        {/* Logo Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white text-lg">
              <FaCheckDouble />
            </div>
            <h1 className="text-sm font-bold tracking-wide leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Workspace Portal
            </h1>
          </div>
          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="flex flex-col gap-2">
          {items.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              end={
                item.path === "/admin" ||
                item.path === "/manager" ||
                item.path === "/employee"
              }
              className={({ isActive }) =>
                `group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-md font-semibold text-glow"
                    : "bg-transparent border-transparent text-[#94a3b8] hover:text-white hover:bg-white/5"
                }`
              }
            >
              <span className="text-lg transition-transform duration-200 group-hover:scale-110">
                {item.icon}
              </span>
              <span className="text-sm tracking-wide">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Profile & Logout Footer */}
      <div className="pt-6 border-t border-white/5">
        {/* User profile details snippet */}
        <div className="flex items-center gap-3.5 p-3.5 bg-white/5 rounded-2xl border border-white/5 mb-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold uppercase shadow-sm">
            {user?.fullName ? user.fullName.charAt(0) : "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-semibold truncate text-white">
              {user?.fullName || "User"}
            </h4>
            <p className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">
              {role}
            </p>
          </div>
        </div>

        {/* Logout Action */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-slate-300 hover:text-red-400 font-semibold text-sm transition-all duration-300 shadow-sm"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </motion.button>
      </div>
    </aside>
  );
}

export default Sidebar;