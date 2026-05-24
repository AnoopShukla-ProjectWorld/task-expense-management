import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaUser, FaEnvelope, FaIdCard, FaPhone, FaLock, FaUserTag } from "react-icons/fa";

function UserModal({ isOpen, onClose, onSubmit, loading, initialData }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const parsePhone = (phoneStr) => {
    if (!phoneStr) return { countryCode: "+91", localNumber: "" };
    if (phoneStr.startsWith("+91")) return { countryCode: "+91", localNumber: phoneStr.slice(3) };
    if (phoneStr.startsWith("+1")) return { countryCode: "+1", localNumber: phoneStr.slice(2) };
    if (phoneStr.startsWith("+44")) return { countryCode: "+44", localNumber: phoneStr.slice(3) };
    if (phoneStr.startsWith("+971")) return { countryCode: "+971", localNumber: phoneStr.slice(4) };
    return { countryCode: "+91", localNumber: phoneStr };
  };

  useEffect(() => {
    if (initialData) {
      const parsed = parsePhone(initialData.mobile_number);
      reset({
        full_name: initialData.full_name,
        email: initialData.email,
        employee_id: initialData.employee_id,
        phone_country: parsed.countryCode,
        phone_local: parsed.localNumber,
        role: initialData.role,
      });
    } else {
      reset({
        full_name: "",
        email: "",
        employee_id: "Auto-Generated",
        phone_country: "+91",
        phone_local: "",
        password: "",
        role: "",
      });
    }
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data) => {
    const { phone_country, phone_local, ...rest } = data;
    const combinedPhone = phone_local ? `${phone_country}${phone_local}` : "";
    const payload = {
      ...rest,
      phone_number: combinedPhone,
      role: data.role,
      department_id: data.department_id
        ? parseInt(data.department_id)
        : undefined,
    };
    onSubmit(payload);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop glass blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
        />

        {/* Modal body */}
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-lg glass-panel rounded-3xl p-6.5 border border-[var(--border-color)] shadow-2xl relative overflow-hidden z-10"
        >
          {/* Decorative ambient background glow */}
          <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center mb-6 relative">
            <div>
              <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
                {initialData ? "Edit Fleet Member" : "Enlist New User"}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Configure profile and core role permissions</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 relative">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Full Name *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] group-focus-within:text-blue-400 transition-colors">
                  <FaUser className="text-sm" />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register("full_name", {
                    required: "Full name is required",
                    pattern: {
                      value: /^[a-zA-Z\s'-]+$/,
                      message: "Name can only contain letters, spaces, hyphens, and apostrophes",
                    },
                  })}
                  className={`w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border ${errors.full_name ? "border-rose-500/50" : "border-[var(--border-color)]"} rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-[var(--bg-secondary)] transition-all`}
                />
              </div>
              {errors.full_name && (
                <p className="text-[11px] text-rose-400 font-semibold">{errors.full_name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Email *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] group-focus-within:text-blue-400 transition-colors">
                  <FaEnvelope className="text-sm" />
                </span>
                <input
                  type="email"
                  placeholder="johndoe@enterprise.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Enter a valid email address",
                    },
                  })}
                  className={`w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border ${errors.email ? "border-rose-500/50" : "border-[var(--border-color)]"} rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-[var(--bg-secondary)] transition-all`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 font-semibold">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col gap-1 sm:w-[150px] sm:shrink-0">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Employee ID</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--text-secondary)]">
                    <FaIdCard className="text-xs" />
                  </span>
                  <input
                    type="text"
                    readOnly
                    {...register("employee_id")}
                    className="w-full pl-9 pr-3 py-3 bg-slate-100/50 dark:bg-slate-900/30 border border-[var(--border-color)] rounded-2xl text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none font-mono font-bold animate-pulse-slow text-center"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-grow">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Phone Number</label>
                <div className="flex gap-2">
                  <div className="relative w-[90px] shrink-0">
                    <select
                      {...register("phone_country")}
                      className="w-full pl-2 pr-6 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 cursor-pointer appearance-none"
                    >
                      <option value="+91" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">🇮🇳 +91</option>
                      <option value="+1" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">🇺🇸 +1</option>
                      <option value="+44" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">🇬🇧 +44</option>
                      <option value="+971" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">🇦🇪 +971</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-[var(--text-secondary)]">
                      <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>

                  <div className="relative flex-grow group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--text-secondary)] group-focus-within:text-blue-400 transition-colors">
                      <FaPhone className="text-xs" />
                    </span>
                    <input
                      type="text"
                      placeholder="9999999999"
                      {...register("phone_local", {
                        validate: (val) => {
                          if (!val) return true; // Optional field
                          if (/[^0-9]/.test(val)) return "Phone number must contain only digits";
                          
                          const country = watch("phone_country");
                          if (country === "+91") {
                            return /^[6-9]\d{9}$/.test(val) || "India number must be 10 digits starting 6-9";
                          }
                          if (country === "+1") {
                            return /^\d{10}$/.test(val) || "USA/Canada number must be 10 digits";
                          }
                          if (country === "+44") {
                            return /^7\d{9}$/.test(val) || "UK number must be 10 digits starting with 7";
                          }
                          if (country === "+971") {
                            return /^5\d{8}$/.test(val) || "UAE number must be 9 digits starting with 5";
                          }
                          return true;
                        }
                      })}
                      className={`w-full pl-9 pr-3 py-3 bg-[var(--bg-tertiary)] border ${errors.phone_local ? "border-rose-500/50" : "border-[var(--border-color)]"} rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-[var(--bg-secondary)] transition-all`}
                    />
                  </div>
                </div>
                {errors.phone_local && (
                  <p className="text-[11px] text-rose-400 font-semibold">{errors.phone_local.message}</p>
                )}
              </div>
            </div>

            {!initialData && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Secure Password *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] group-focus-within:text-blue-400 transition-colors">
                    <FaLock className="text-sm" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                    })}
                    className={`w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border ${errors.password ? "border-rose-500/50" : "border-[var(--border-color)]"} rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-[var(--bg-secondary)] transition-all`}
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-400 font-semibold">{errors.password.message}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">System Authorization Role *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] group-focus-within:text-blue-400 transition-colors pointer-events-none">
                  <FaUserTag className="text-sm" />
                </span>
                <select
                  {...register("role", { required: "Access role is required" })}
                  className={`w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border ${errors.role ? "border-rose-500/50" : "border-[var(--border-color)]"} rounded-2xl text-sm text-[var(--text-primary)] outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 cursor-pointer transition-all focus:bg-[var(--bg-secondary)]`}
                >
                  <option value="" disabled className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">Select Access Tier</option>
                  <option value="manager" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Manager (Project Lead)</option>
                  <option value="employee" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Employee (Operational Staff)</option>
                </select>
              </div>
              {errors.role && (
                <p className="text-[11px] text-rose-400 font-semibold">{errors.role.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl text-xs transition-colors disabled:opacity-50 cursor-pointer text-glow shadow-md shadow-blue-500/20"
              >
                {loading ? "Authorizing..." : initialData ? "Update Registry" : "Register Member"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default UserModal;