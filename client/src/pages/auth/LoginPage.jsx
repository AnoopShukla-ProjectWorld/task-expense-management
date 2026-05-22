import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaCheckDouble, FaUserShield, FaUserTie, FaUser } from "react-icons/fa";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      const role = result.user.role;
      if (role === "ADMIN") navigate("/admin");
      else if (role === "MANAGER") navigate("/manager");
      else navigate("/employee");
    }
  };

  const handleQuickLogin = (email) => {
    setValue("email", email);
    setValue("password", "password123");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#070b13] overflow-hidden px-4">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-panel rounded-3xl p-8 md:p-10 relative overflow-hidden border border-white/5 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 text-white text-2xl mb-4"
            >
              <FaCheckDouble />
            </motion.div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
              Task & Expense Management
            </h2>
            <p className="text-sm text-[#94a3b8]">
              Enterprise Intelligence Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  {...register("email", { required: "Email is required" })}
                  className={`w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border ${
                    errors.email ? "border-red-500" : "border-white/5"
                  } rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/10 transition-all duration-200`}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs text-red-400 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <FaLock />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required" })}
                  className={`w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border ${
                    errors.password ? "border-red-500" : "border-white/5"
                  } rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/10 transition-all duration-200`}
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-400 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-indigo-500/30 cursor-pointer"
            >
              Sign In
            </motion.button>
          </form>

          {/* Quick Demo Credentials Presets */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <h4 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Quick Organization Presets
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@system.com")}
                className="flex flex-col items-center gap-1.5 p-2 bg-white/5 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 rounded-xl transition-all duration-300 cursor-pointer group"
              >
                <FaUserShield className="text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-[10px] font-bold text-white">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("manager1@system.com")}
                className="flex flex-col items-center gap-1.5 p-2 bg-white/5 hover:bg-violet-600/10 border border-white/5 hover:border-violet-500/30 rounded-xl transition-all duration-300 cursor-pointer group"
              >
                <FaUserTie className="text-violet-400 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-[10px] font-bold text-white">Manager</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("employee1@system.com")}
                className="flex flex-col items-center gap-1.5 p-2 bg-white/5 hover:bg-emerald-600/10 border border-white/5 hover:border-emerald-500/30 rounded-xl transition-all duration-300 cursor-pointer group"
              >
                <FaUser className="text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-[10px] font-bold text-white">Employee</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;