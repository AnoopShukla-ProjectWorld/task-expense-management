import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaLock, FaSpinner, FaArrowLeft, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import { resetPasswordApi } from "../../services/authService";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "Weak", color: "bg-red-500" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const passwordVal = watch("password", "");

  // Strength checker
  useEffect(() => {
    if (!passwordVal) {
      setPasswordStrength({ score: 0, text: "None", color: "bg-slate-300" });
      return;
    }
    let score = 0;
    if (passwordVal.length >= 8) score++;
    if (/[A-Z]/.test(passwordVal)) score++;
    if (/[a-z]/.test(passwordVal)) score++;
    if (/[0-9]/.test(passwordVal)) score++;
    if (/[@$!%*?&]/.test(passwordVal)) score++;

    let text = "Weak";
    let color = "bg-red-500";
    if (score >= 4) {
      text = "Strong";
      color = "bg-emerald-500 shadow-lg shadow-emerald-500/30";
    } else if (score >= 3) {
      text = "Medium";
      color = "bg-amber-500 shadow-lg shadow-amber-500/30";
    }
    setPasswordStrength({ score, text, color });
  }, [passwordVal]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error("Password reset token is missing from URL query parameters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPasswordApi({ token, password: data.password });
      if (response.success) {
        toast.success("Password updated successfully! You can now log in.");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password. Token may be invalid or expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] overflow-hidden px-4 transition-colors duration-300">
      
      {/* Back button */}
      <div className="absolute top-6 left-6 z-50">
        <Link
          to="/login"
          className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-300 shadow-lg cursor-pointer"
        >
          <FaArrowLeft className="text-xs" />
          <span className="text-xs font-semibold">Back to Login</span>
        </Link>
      </div>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[35%] h-[35%] rounded-full bg-blue-600/5 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-600/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-panel bg-[var(--bg-secondary)] rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-2xl relative">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white text-2xl mb-4">
              <FaKey />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
              Setup New Password
            </h2>
            <p className="text-sm text-slate-500">
              Establish a new, strong password to restore credentials and platform authorization
            </p>
          </div>

          {!token ? (
            <div className="text-center space-y-4 py-4 text-rose-500 font-semibold bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
              ⚠️ Invalid password recovery link. The token parameter is missing. Please check your recovery email url.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <FaLock />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register("password", { 
                      required: "Password is required",
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                        message: "Must be 8+ chars with uppercase, lowercase, number, and special character (@$!%*?&)"
                      }
                    })}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-xs text-red-500 font-medium">{errors.password.message}</p>
                )}

                {/* Password Strength Meter */}
                {passwordVal && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Strength: {passwordStrength.text}</span>
                      <span className="text-slate-500 font-bold">{passwordStrength.score}/5</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`} 
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <FaLock />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register("confirmPassword", { 
                      required: "Please confirm your password",
                      validate: (value) => value === passwordVal || "Passwords do not match"
                    })}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer focus:outline-none"
                  >
                    {showConfirmPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <FaSpinner className="animate-spin text-sm" />
                ) : (
                  <span>Update Master Password</span>
                )}
              </motion.button>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;

