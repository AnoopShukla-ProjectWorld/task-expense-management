import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaBell, FaBars, FaChevronDown, FaCheckCircle, FaExclamationCircle, FaSun, FaMoon } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markAsRead, deleteNotification } from "../../services/notificationService";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";

function Navbar({ onMenuToggle }) {
  const { user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 15000, // Poll every 15s
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Mark Read Mutation
  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Delete Notification Mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = async (n) => {
    // Close notifications panel
    setShowNotifications(false);

    // 1. Redirect immediately to the target page based on user role and notification type
    const role = user?.role;
    const type = n.type;

    if (type === "TASK") {
      if (role === "EMPLOYEE") {
        navigate("/employee/tasks");
      } else if (role === "MANAGER") {
        navigate("/manager/tasks");
      } else if (role === "ADMIN") {
        navigate("/admin/tasks");
      }
    } else if (type === "PROJECT") {
      if (role === "MANAGER") {
        navigate("/manager/projects");
      } else if (role === "ADMIN") {
        navigate("/admin/projects");
      }
    } else if (type === "EXPENSE") {
      if (role === "EMPLOYEE") {
        navigate("/employee/expenses");
      } else if (role === "MANAGER") {
        const isTeam = n.title?.toLowerCase().includes("new expense") || n.message?.toLowerCase().includes("submitted") || n.message?.toLowerCase().includes("approved a");
        navigate("/manager/expenses", { state: { activeTab: isTeam ? "team" : "my" } });
      } else if (role === "ADMIN") {
        navigate("/admin/expenses");
      }
    }

    // 2. Perform network operations (mark read, delete) silently in the background
    try {
      if (!n.is_read) {
        await markReadMutation.mutateAsync(n.id);
      }
      await deleteNotificationMutation.mutateAsync(n.id);
    } catch (err) {
      console.error("Error processing notification mutation silently:", err);
    }
  };

  return (
    <header className="relative w-full z-30 px-6 py-4 flex justify-between items-center bg-[var(--bg-secondary)]/80 border-b border-[var(--border-color)] backdrop-blur-md">
      {/* Mobile Toggle & Brand/Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all focus:outline-none cursor-pointer"
        >
          <FaBars className="text-lg" />
        </button>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] hidden sm:block">
            Console Overview
          </h2>
        </div>
      </div>

      {/* Right-Side Actions */}
      <div className="flex items-center gap-4">
        {/* Notification System */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-300 focus:outline-none cursor-pointer"
          >
            <FaBell className="text-base" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed sm:absolute top-[72px] sm:top-auto left-4 right-4 sm:left-auto sm:right-0 mt-3 sm:w-80 glass-panel bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-color)] shadow-2xl z-40 text-[var(--text-primary)]"
              >
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]/60 mb-3">
                    <span className="font-bold text-sm tracking-wide text-[var(--text-primary)]">
                      Notifications
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-600/20 text-blue-500 rounded-full font-semibold">
                      {unreadCount} new
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2.5 scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`group flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            n.is_read
                              ? "bg-transparent border-transparent opacity-60"
                              : "bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          <span
                            className={`group-hover:text-blue-500 transition-colors ${
                              n.is_read ? "text-[var(--text-secondary)]" : "text-blue-500"
                            }`}
                          >
                            {n.is_read ? <FaCheckCircle /> : <FaExclamationCircle />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {n.title}
                            </h5>
                            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="h-6 w-[1px] bg-[var(--border-color)]" />

        {/* User Card */}
        <div 
          onClick={() => navigate(`/${user?.role?.toLowerCase()}/profile`)}
          className="flex items-center gap-3.5 pl-1.5 py-1 pr-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl cursor-pointer hover:bg-[var(--bg-hover)] hover:border-blue-500/20 transition-all duration-200"
        >
          {user?.profile_image ? (
            <img
              src={`http://localhost:5000${user.profile_image}`}
              alt={user.fullName || "User"}
              className="w-8.5 h-8.5 rounded-lg object-cover border border-[var(--border-color)]"
            />
          ) : (
            <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold uppercase shadow-sm text-xs">
              {user?.fullName ? user.fullName.charAt(0) : "U"}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <h4 className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[120px]">
              {user?.fullName || "User"}
            </h4>
            <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
