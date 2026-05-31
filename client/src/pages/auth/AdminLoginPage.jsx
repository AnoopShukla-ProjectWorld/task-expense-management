import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaEnvelope,
  FaLock,
  FaKey,
  FaShieldAlt,
  FaSpinner,
  FaRedo,
  FaArrowLeft
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { secureAdminLoginApi, getCaptchaApi } from "../../services/authService";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  // States
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaHash, setCaptchaHash] = useState("");
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Load CAPTCHA
  const fetchCaptcha = async () => {
    setIsCaptchaLoading(true);
    try {
      const response = await getCaptchaApi();
      if (response.success) {
        setCaptchaImage(response.data.image);
        setCaptchaHash(response.data.hash);
      }
    } catch (err) {
      toast.error("Failed to generate CAPTCHA. Please refresh.");
    } finally {
      setIsCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await secureAdminLoginApi({
        email: data.email,
        password: data.password,
        secretPassphrase: data.secretPassphrase,
        captchaInput: data.captchaInput,
        captchaHash: captchaHash,
      });

      if (response.success) {
        toast.success("Welcome back, Administrator! Portal authenticated.");
        const loggedInUser = response.data.user;
        setUser(loggedInUser);
        localStorage.setItem("session_active", "true");
        navigate("/admin");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid administrative credentials or secret passkey.");
      fetchCaptcha(); // Auto-refresh CAPTCHA on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] overflow-hidden px-4 transition-colors duration-300">
      
      {/* Floating back button */}
      <div className="absolute top-6 left-6 z-50">
        <Link
          to="/login"
          className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-300 shadow-lg cursor-pointer"
        >
          <FaArrowLeft className="text-xs" />
          <span className="text-xs font-semibold">Public Portal</span>
        </Link>
      </div>

      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[35%] h-[35%] rounded-full bg-rose-600/5 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-amber-600/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-panel bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-2xl relative">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 shadow-md shadow-rose-500/20 text-white text-2xl mb-4">
              <FaShieldAlt />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
              Secure Administrative Login
            </h2>
            <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">
              Classified Access Only
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Administrative Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  placeholder="admin@system.com"
                  {...register("email", { required: "Email is required" })}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:bg-white transition-all duration-200"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Master Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FaLock />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required" })}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:bg-white transition-all duration-200"
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Secret Passphrase */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Secret Passphrase Key
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FaKey />
                </span>
                <input
                  type="password"
                  placeholder="Secret passphrase..."
                  {...register("secretPassphrase", { required: "Secret passphrase key is required" })}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:bg-white transition-all duration-200"
                />
              </div>
              {errors.secretPassphrase && (
                <p className="mt-2 text-xs text-red-500 font-medium">{errors.secretPassphrase.message}</p>
              )}
            </div>

            {/* CAPTCHA SECTION */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mandatory Anti-Brute Force Shield
                </label>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="text-xs text-rose-600 hover:text-rose-500 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FaRedo className={isCaptchaLoading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>

              <div className="flex gap-4 items-center">
                {captchaImage ? (
                  <img 
                    src={captchaImage} 
                    alt="CAPTCHA Challenge" 
                    className="rounded-xl border border-red-200 shadow-sm bg-white flex-shrink-0 h-[50px] w-[150px] object-cover" 
                  />
                ) : (
                  <div className="rounded-xl border border-red-200 shadow-sm bg-white flex-shrink-0 h-[50px] w-[150px] animate-pulse bg-red-50" />
                )}
                <input
                  type="text"
                  placeholder="CAPTCHA Code"
                  {...register("captchaInput", { required: "CAPTCHA is required" })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-center font-bold tracking-wider placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors uppercase"
                />
              </div>
              {errors.captchaInput && (
                <p className="text-xs text-red-500 font-medium">{errors.captchaInput.message}</p>
              )}
            </div>

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-rose-500/25 hover:shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin text-sm" />
              ) : (
                <span>Authenticate Security Clearance</span>
              )}
            </motion.button>
          </form>

        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
