import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaProjectDiagram, FaCalendarAlt, FaFlag, FaInfoCircle, FaDollarSign, FaChartLine, FaUserTie } from "react-icons/fa";
import { getUsers } from "../../services/userService";

function ProjectModal({ isOpen, onClose, onSubmit, loading, initialData }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  // Fetch managers dynamically to assign to projects
  const { data: managers } = useQuery({
    queryKey: ["users", "MANAGER"],
    queryFn: () => getUsers({ role: "MANAGER" }),
    enabled: isOpen,
  });

  useEffect(() => {
    if (initialData) {
      const startDate = initialData.start_date
        ? new Date(initialData.start_date).toISOString().split("T")[0]
        : "";
      const endDate = initialData.end_date
        ? new Date(initialData.end_date).toISOString().split("T")[0]
        : "";

      reset({
        project_name: initialData.project_name || "",
        description: initialData.description || "",
        start_date: startDate,
        end_date: endDate,
        status: initialData.status || "PLANNED",
        priority: initialData.priority || "MEDIUM",
        assigned_manager_id: initialData.assigned_manager_id || "",
        budget: initialData.budget || "",
        completion_percentage: initialData.completion_percentage || 0,
      });
    } else {
      reset({
        project_name: "",
        description: "",
        start_date: "",
        end_date: "",
        status: "PLANNED",
        priority: "MEDIUM",
        assigned_manager_id: "",
        budget: "",
        completion_percentage: 0,
      });
    }
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      assigned_manager_id: parseInt(data.assigned_manager_id),
      budget: data.budget ? parseFloat(data.budget) : null,
      completion_percentage: parseInt(data.completion_percentage || 0),
    };
    onSubmit(payload);
  };

  const startDateWatch = watch("start_date");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-955/65 backdrop-blur-md cursor-pointer"
        />

        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-lg glass-panel rounded-3xl p-6.5 border border-white/10 shadow-2xl relative overflow-hidden z-10 my-8"
        >
          {/* Decorative background ambient lighting */}
          <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center mb-6 relative">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {initialData ? "Edit Project Blueprint" : "Initialize New Project"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">Configure project scopes, limits, and leadership</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 scrollbar-thin relative">
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Project Name *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <FaProjectDiagram className="text-sm" />
                </span>
                <input
                  type="text"
                  placeholder="Enterprise Core Upgrade"
                  required
                  {...register("project_name", { required: "Project name is required" })}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-white/[0.07] transition-all"
                />
              </div>
              {errors.project_name && (
                <p className="text-xs text-rose-400 font-bold mt-1">{errors.project_name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Scope & Description</label>
              <div className="relative group">
                <span className="absolute top-3 left-4 text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <FaInfoCircle className="text-sm" />
                </span>
                <textarea
                  rows={3}
                  placeholder="Describe project targets, goals, and team expectations..."
                  {...register("description")}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-white/[0.07] transition-all resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Start Date *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <FaCalendarAlt className="text-sm" />
                  </span>
                  <input
                    type="date"
                    required
                    {...register("start_date", { required: "Start date is required" })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                {errors.start_date && (
                  <p className="text-xs text-rose-400 font-bold mt-1">{errors.start_date.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">End Target</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <FaCalendarAlt className="text-sm" />
                  </span>
                  <input
                    type="date"
                    {...register("end_date", {
                      validate: (val) => {
                        if (!val) return true;
                        if (!startDateWatch) return true;
                        return new Date(val) >= new Date(startDateWatch) || "End target must exceed start date";
                      }
                    })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                {errors.end_date && (
                  <p className="text-xs text-rose-400 font-bold mt-1">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Priority Rating *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <FaFlag className="text-sm" />
                  </span>
                  <select
                    required
                    {...register("priority", { required: "Priority is required" })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 cursor-pointer transition-all"
                  >
                    <option value="LOW" className="bg-slate-950 text-slate-200">Low</option>
                    <option value="MEDIUM" className="bg-slate-950 text-slate-200">Medium</option>
                    <option value="HIGH" className="bg-slate-950 text-slate-200">High</option>
                    <option value="CRITICAL" className="bg-slate-950 text-slate-200">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">State / Status *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <FaChartLine className="text-sm" />
                  </span>
                  <select
                    required
                    {...register("status", { required: "Status is required" })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 cursor-pointer transition-all"
                  >
                    <option value="PLANNED" className="bg-slate-950 text-slate-200">Planned</option>
                    <option value="ACTIVE" className="bg-slate-950 text-slate-200">Active</option>
                    <option value="ON_HOLD" className="bg-slate-950 text-slate-200">On Hold</option>
                    <option value="COMPLETED" className="bg-slate-950 text-slate-200">Completed</option>
                    <option value="CANCELLED" className="bg-slate-950 text-slate-200">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Assigned Project Manager *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                  <FaUserTie className="text-sm" />
                </span>
                <select
                  required
                  {...register("assigned_manager_id", { required: "Manager assignment is required" })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 cursor-pointer transition-all"
                >
                  <option value="" disabled className="bg-slate-950 text-slate-400">Select Supervisor</option>
                  {managers?.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-950 text-slate-200">
                      {m.full_name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              {errors.assigned_manager_id && (
                <p className="text-xs text-rose-400 font-bold mt-1">{errors.assigned_manager_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Total Budget (₹)</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50000"
                    {...register("budget", { 
                      required: "Budget is required",
                      min: { value: 0, message: "Budget must be positive" } 
                    })}
                    onKeyPress={(e) => {
                      if (/[^0-9.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-white/[0.07] transition-all"
                  />
                </div>
                {errors.budget && (
                  <p className="text-xs text-rose-400 font-bold mt-1">{errors.budget.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Blueprint Progress (%)</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                    <FaChartLine className="text-sm" />
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="25"
                    {...register("completion_percentage", {
                      min: { value: 0, message: "Min limit is 0" },
                      max: { value: 100, message: "Max limit is 100" },
                    })}
                    onKeyPress={(e) => {
                      if (/[^0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-white/[0.07] transition-all"
                  />
                </div>
                {errors.completion_percentage && (
                  <p className="text-xs text-rose-400 font-bold mt-1">{errors.completion_percentage.message}</p>
                )}
              </div>
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
                {loading ? "Deploying..." : initialData ? "Save Blueprint" : "Deploy Project"}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ProjectModal;
