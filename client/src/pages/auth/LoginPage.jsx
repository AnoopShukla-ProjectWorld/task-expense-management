import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaCheckDouble,
  FaSun,
  FaMoon,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaArrowRight,
  FaSpinner
} from "react-icons/fa";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  // States
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const result = await login({
      emailOrMobile: data.emailOrMobile,
      password: data.password,
    });

    if (result.success) {
      const role = result.user.role;
      if (role === "ADMIN") navigate("/admin");
      else if (role === "MANAGER") navigate("/manager");
      else navigate("/employee");
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] overflow-hidden px-4 transition-colors duration-300">
      
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          type="button"
          className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-300 shadow-lg cursor-pointer"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? (
            <FaSun className="text-base text-yellow-400" />
          ) : (
            <FaMoon className="text-base text-indigo-500" />
          )}
        </button>
      </div>

      {/* Secret admin login entry point */}
      <div className="absolute top-6 left-6 z-50">
        <Link
          to="/secure-admin-login"
          className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--bg-hover)] transition-all duration-300 shadow-lg cursor-pointer"
        >
          <FaShieldAlt className="text-xs" />
          <span className="text-xs font-semibold">Secure Admin Entrance</span>
        </Link>
      </div>

      {/* Decorative Glow elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel bg-[var(--bg-secondary)] rounded-3xl p-8 md:p-10 border border-slate-200 dark:border-slate-800/80 shadow-2xl relative">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 text-white text-2xl mb-4">
              <FaCheckDouble />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Task & Expense Management System
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Employee & Manager Workspace Login
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Username/Email/Mobile input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Email Address or Mobile Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                  <FaEnvelope />
                </span>
                <input
                  type="text"
                  placeholder="name@company.com or mobile number"
                  {...register("emailOrMobile", { required: "Email address or Mobile number is required" })}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-200"
                />
              </div>
              {errors.emailOrMobile && (
                <p className="mt-2 text-xs text-red-500 font-medium">{errors.emailOrMobile.message}</p>
              )}
            </div>

            {/* Password input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                  <FaLock />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required" })}
                  className="w-full pl-11 pr-11 py-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>


            {/* Submit button */}
            <motion.button
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              disabled={isSubmitting}
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <FaArrowRight className="text-xs" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer links */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Don't have an account yet?{" "}
              <Link to="/register" className="text-blue-600 hover:text-blue-500 font-bold transition-colors">
                Register Publicly
              </Link>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;