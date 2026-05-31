import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { 
  FaCheckDouble, FaShieldAlt, FaUserTie, FaUserPlus, 
  FaChartLine, FaArrowRight, FaSpinner, FaFileAlt 
} from "react-icons/fa";

const HomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Automatic routing for already-authenticated users
  useEffect(() => {
    if (!loading && user) {
      const role = user.role?.toUpperCase();
      if (role === "ADMIN") navigate("/admin");
      else if (role === "MANAGER") navigate("/manager");
      else navigate("/employee");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin text-4xl text-[var(--accent-purple)]" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">Establishing Secure Connection...</p>
        </div>
      </div>
    );
  }

  // Animated configurations for staggered entrances
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] overflow-hidden flex flex-col justify-between">
      
      {/* Decorative premium ambient shapes */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-[var(--accent-purple)]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[var(--accent-blue)]/5 blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full px-6 py-5 max-w-7xl mx-auto flex items-center justify-between border-b border-[var(--border-color)]/60 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center text-white text-lg shadow-md shadow-[var(--accent-purple)]/20">
            <FaCheckDouble />
          </div>
          <span className="font-bold text-lg tracking-tight text-[var(--text-primary)]">
            Task & Expense Hub
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-[var(--border-color)] text-2xs sm:text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer whitespace-nowrap"
          >
            Staff Sign In
          </Link>
          <Link
            to="/register"
            className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] hover:opacity-90 text-white text-2xs sm:text-xs font-bold transition-all shadow-md shadow-[var(--accent-purple)]/15 cursor-pointer whitespace-nowrap"
          >
            Join System
          </Link>
        </div>
      </header>

      {/* Hero and Gates Split */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left Side: Bold Corporate Copy */}
        <div className="lg:col-span-5 space-y-6 text-left">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="px-3 py-1 rounded-full bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] font-bold text-[10px] uppercase tracking-wider">
              ⚡ Unified Enterprise Operations
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
              Optimize Fleet <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)]">
                Workflows & Expenses
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed font-medium">
              Seamlessly delegate operations, track project blueprints, file receipted claims, and inspect chronological audit trails inside a secure workspace.
            </p>
          </motion.div>

          {/* Quick Metrics Ticker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-3 gap-4 pt-6 border-t border-[var(--border-color)]/60"
          >
            <div>
              <p className="text-2xl font-black text-[var(--text-primary)]">100%</p>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">Real-time Sync</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[var(--text-primary)]">Zero</p>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">Autofill Pre-fills</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[var(--text-primary)]">Secure</p>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">Audit-Proofed</p>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Entrance Portals (High-Fidelity Cards Grid) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {/* Card 1: Staff Workspace Entrance */}
          <motion.div
            variants={itemVariants}
            className="glass-panel p-6 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-56 border border-[var(--border-color)] hover:border-slate-300"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-[var(--accent-blue)] text-lg">
                <FaUserTie />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Staff Workspace</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  Entrance gateway for active Employees and supervising Project Managers.
                </p>
              </div>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-blue)] hover:gap-2 transition-all mt-4 group"
            >
              Access Dashboard <FaArrowRight className="text-[10px]" />
            </Link>
          </motion.div>

          {/* Card 2: Administrative Clearance Entrance */}
          <motion.div
            variants={itemVariants}
            className="glass-panel p-6 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-56 border border-[var(--border-color)] hover:border-slate-300"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 text-lg">
                <FaShieldAlt />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Administrative Portal</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  Classified master access gateway for system operators and system audits.
                </p>
              </div>
            </div>
            <Link
              to="/secure-admin-login"
              className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:gap-2 transition-all mt-4 group"
            >
              Security Clearance <FaArrowRight className="text-[10px]" />
            </Link>
          </motion.div>

          {/* Card 3: Public Account Registration */}
          <motion.div
            variants={itemVariants}
            className="glass-panel p-6 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-56 border border-[var(--border-color)] hover:border-slate-300 sm:col-span-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-3 max-w-md">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-lg">
                  <FaUserPlus />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Enroll New Account</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    Submit personal credentials and request corporate clearance key to enroll in the system.
                  </p>
                </div>
              </div>
              <Link
                to="/register"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 self-end sm:self-center"
              >
                Register Publicly <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer Info */}
      <footer className="w-full py-6 border-t border-[var(--border-color)]/60 text-center z-10">
        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
          © {new Date().getFullYear()} Task & Expense Management Hub. All Clearance Policies Apply.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
