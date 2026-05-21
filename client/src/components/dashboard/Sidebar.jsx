import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import {
    FaUsers,
    FaTasks,
    FaProjectDiagram,
    FaMoneyBill,
    FaChartBar,
    FaFileAlt,
    FaClipboardList,
} from "react-icons/fa";

import { NavLink } from "react-router-dom";

const menuItems = [
    {
        name: "Dashboard",
        path: "/admin",
        icon: <FaChartBar />,
    },

    {
        name: "Users",
        path: "/admin/users",
        icon: <FaUsers />,
    },

    {
        name: "Projects",
        path: "/admin/projects",
        icon: <FaProjectDiagram />,
    },

    {
        name: "Tasks",
        path: "/admin/tasks",
        icon: <FaTasks />,
    },

    {
        name: "Expenses",
        path: "/admin/expenses",
        icon: <FaMoneyBill />,
    },

    { name: "Reports", path: "/admin/reports", icon: <FaFileAlt /> },
    { name: "Audit Logs", path: "/admin/audit-logs", icon: <FaClipboardList /> },
];

function Sidebar() {
    const { logout } = useAuth();

    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };
    
    return (
        <aside
            className="
        w-72 min-h-screen
        bg-slate-900 text-white
        p-5 flex flex-col
      "
        >
            <h1 className="text-2xl font-bold mb-10">
                Task Expense
            </h1>

            <nav className="flex flex-col gap-3">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `
              flex items-center gap-3
              px-4 py-3 rounded-xl
              transition-all duration-200

              ${isActive
                                ? "bg-blue-600"
                                : "hover:bg-slate-800"
                            }
            `
                        }
                    >
                        {item.icon}

                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;