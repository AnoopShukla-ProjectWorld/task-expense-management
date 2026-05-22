import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaBell, FaBars, FaChevronDown, FaCheckCircle, FaExclamationCircle, FaSun, FaMoon } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markAsRead } from "../../services/notificationService";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

function Navbar({ onMenuToggle }) {
  const { user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);

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

  const handleMarkRead = (id) => {
    markReadMutation.mutate(id);
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
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-300 focus:outline-none cursor-pointer"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? (
            <FaSun className="text-base text-yellow-400" />
          ) : (
            <FaMoon className="text-base text-indigo-400" />
          )}
        </button>

        {/* Notification System */}
        <div className="relative">
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
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-80 glass-panel bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-color)] shadow-2xl z-40 text-[var(--text-primary)]"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]/60 mb-3">
                    <span className="font-bold text-sm tracking-wide text-[var(--text-primary)]">
                      Notifications
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-600/20 text-blue-500 dark:text-blue-400 rounded-full font-semibold">
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
                          onClick={() => handleMarkRead(n.id)}
                          className={`group flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            n.is_read
                              ? "bg-transparent border-transparent opacity-60"
                              : "bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          <span
                            className={`mt-0.5 text-base ${
                              n.is_read ? "text-[var(--text-secondary)]" : "text-blue-500 dark:text-blue-400"
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
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="h-6 w-[1px] bg-[var(--border-color)]" />

        {/* User Card */}
        <div className="flex items-center gap-3.5 pl-1.5 py-1 pr-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl">
          <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold uppercase shadow-sm text-xs">
            {user?.fullName ? user.fullName.charAt(0) : "U"}
          </div>
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