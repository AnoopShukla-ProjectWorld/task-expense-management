import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { motion } from "framer-motion";

const ProtectedRoute = () => {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  // WAIT FOR AUTH RESTORE
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#070b13] relative overflow-hidden">
        {/* Dynamic Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />

        <div className="flex flex-col items-center gap-4 z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500"
          />
          <motion.p
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400"
          >
            Securing Connection...
          </motion.p>
        </div>
      </div>
    );
  }

  // NOT LOGGED IN
  if (!isAuthenticated) {
    return (
      <Navigate to="/login" />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;