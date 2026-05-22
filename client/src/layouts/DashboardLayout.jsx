import { useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function DashboardLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Background Mesh Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[35%] h-[35%] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      {/* Desktop Sidebar (visible on lg+) */}
      <div className="hidden lg:block z-20 h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar sliding drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden shadow-2xl"
            >
              <Sidebar onClose={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden z-10">
        <Navbar onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;