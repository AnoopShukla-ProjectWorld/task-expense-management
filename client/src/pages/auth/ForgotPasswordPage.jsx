import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEnvelope, FaSpinner, FaArrowLeft, FaKey } from "react-icons/fa";
import toast from "react-hot-toast";
import { forgotPasswordApi } from "../../services/authService";

const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await forgotPasswordApi({ email: data.email });
      if (response.success) {
        setIsSent(true);
        toast.success("If the account exists, a reset link has been simulated in logs!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate password reset request.");
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
        <div className="glass-panel bg-[var(--bg-secondary)] rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800/80 shadow-2xl relative">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white text-2xl mb-4">
              <FaKey />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Recover Workspace Password
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Input your corporate email address to receive a secure password recovery token
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-200"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-xs text-red-500 font-medium">{errors.email.message}</p>
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
                  <span>Send Password Reset Token</span>
                )}
              </motion.button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="text-emerald-500 text-sm font-semibold bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                📬 Recovery link dispatched successfully!
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A password recovery email containing your unique restoration link has been logged inside server terminal logs. Use the link to establish a new password.
              </p>
              <Link
                to="/login"
                className="inline-block px-5 py-2.5 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
              >
                Return to Login
              </Link>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
