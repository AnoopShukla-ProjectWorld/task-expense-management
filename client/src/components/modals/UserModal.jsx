import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaUser, FaEnvelope, FaIdCard, FaPhone, FaLock, FaUserTag } from "react-icons/fa";

function UserModal({ isOpen, onClose, onSubmit, loading, initialData }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (initialData) {
      reset({
        full_name: initialData.full_name,
        email: initialData.email,
        employee_id: initialData.employee_id,
        phone_number: initialData.phone_number || "",
        role_id: initialData.role_id,
      });
    } else {
      reset({
        full_name: "",
        email: "",
        employee_id: "",
        phone_number: "",
        password: "",
        role_id: "",
      });
    }
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      role_id: parseInt(data.role_id),
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
          className="w-full max-w-lg glass-panel rounded-3xl p-6.5 border border-white/10 shadow-2xl relative overflow-hidden z-10"
        >
          {/* Decorative ambient background glow */}
          <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center mb-6 relative">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {initialData ? "Edit Fleet Member" : "Enlist New User"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">Configure profile and core role permissions</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 relative">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Full Name *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <FaUser className="text-sm" />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register("full_name", {
                    required: "Full name is required",
                    pattern: {
                      value: /^[a-zA-Z\s]+$/,
                      message: "Name can only contain letters and spaces",
                    },
                  })}
                  onKeyPress={(e) => {
                    if (/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${errors.full_name ? "border-rose-500/50" : "border-white/5"} rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-white/[0.07] transition-all`}
                />
              </div>
              {errors.full_name && (
                <p className="text-[11px] text-rose-400 font-semibold">{errors.full_name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Email *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
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
                  className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${errors.email ? "border-rose-500/50" : "border-white/5"} rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-white/[0.07] transition-all`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 font-semibold">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Employee ID *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                    <FaIdCard className="text-sm" />
                  </span>
                  <input
                    type="text"
                    placeholder="EMP088"
                    {...register("employee_id", {
                      required: "Employee ID is required",
                    })}
                    className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${errors.employee_id ? "border-rose-500/50" : "border-white/5"} rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-white/[0.07] transition-all`}
                  />
                </div>
                {errors.employee_id && (
                  <p className="text-[11px] text-rose-400 font-semibold">{errors.employee_id.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Phone Number</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                    <FaPhone className="text-sm" />
                  </span>
                  <input
                    type="text"
                    placeholder="+91 9999999999"
                    {...register("phone_number", {
                      pattern: {
                        value: /^[0-9+\-\s()]*$/,
                        message: "Invalid phone number format",
                      },
                    })}
                    className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${errors.phone_number ? "border-rose-500/50" : "border-white/5"} rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-white/[0.07] transition-all`}
                  />
                </div>
                {errors.phone_number && (
                  <p className="text-[11px] text-rose-400 font-semibold">{errors.phone_number.message}</p>
                )}
              </div>
            </div>

            {!initialData && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Secure Password *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                    <FaLock className="text-sm" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                    })}
                    className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${errors.password ? "border-rose-500/50" : "border-white/5"} rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-white/[0.07] transition-all`}
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-400 font-semibold">{errors.password.message}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">System Authorization Role *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                  <FaUserTag className="text-sm" />
                </span>
                <select
                  {...register("role_id", { required: "Access role is required" })}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-900 border ${errors.role_id ? "border-rose-500/50" : "border-white/5"} rounded-2xl text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 cursor-pointer transition-all`}
                >
                  <option value="" disabled className="bg-slate-950 text-slate-400">Select Access Tier</option>
                  <option value="1" className="bg-slate-950 text-slate-200">Admin (Full Control)</option>
                  <option value="2" className="bg-slate-950 text-slate-200">Manager (Project Lead)</option>
                  <option value="3" className="bg-slate-950 text-slate-200">Employee (Operational Staff)</option>
                </select>
              </div>
              {errors.role_id && (
                <p className="text-[11px] text-rose-400 font-semibold">{errors.role_id.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
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