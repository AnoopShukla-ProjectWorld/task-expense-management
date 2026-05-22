import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaTasks, FaCalendarAlt, FaFlag, FaInfoCircle, FaProjectDiagram, FaUser, FaChartLine } from "react-icons/fa";
import { getProjects } from "../../services/projectService";
import { getUsers } from "../../services/userService";

function TaskModal({ isOpen, onClose, onSubmit, loading, initialData, defaultProjectId }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  // Fetch projects dynamically for dropdown select
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
    enabled: isOpen,
  });

  // Fetch employees dynamically for assignment select
  const { data: employees } = useQuery({
    queryKey: ["users", "EMPLOYEE"],
    queryFn: () => getUsers({ role: "EMPLOYEE" }),
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const startDate = initialData.start_date
          ? new Date(initialData.start_date).toISOString().split("T")[0]
          : "";
        const dueDate = initialData.due_date
          ? new Date(initialData.due_date).toISOString().split("T")[0]
          : "";

        reset({
          title: initialData.title || "",
          description: initialData.description || "",
          project_id: initialData.project_id || defaultProjectId || "",
          assigned_to: initialData.assigned_to || "",
          start_date: startDate,
          due_date: dueDate,
          priority: initialData.priority || "MEDIUM",
          status: initialData.status || "PENDING",
          completion_percentage: initialData.completion_percentage || 0,
        });
      } else {
        reset({
          title: "",
          description: "",
          project_id: defaultProjectId || "",
          assigned_to: "",
          start_date: "",
          due_date: "",
          priority: "MEDIUM",
          status: "PENDING",
          completion_percentage: 0,
        });
      }
    }
  }, [initialData, isOpen, reset, defaultProjectId]);

  if (!isOpen) return null;

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      project_id: parseInt(data.project_id),
      assigned_to: parseInt(data.assigned_to),
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
          <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center mb-6 relative">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {initialData ? "Edit Operation Blueprint" : "Initialize New Task"}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">Set tasks scopes, priorities, and assign operations</p>
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
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Task Title *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-violet-400 transition-colors">
                  <FaTasks className="text-sm" />
                </span>
                <input
                  type="text"
                  placeholder="Review Database Architecture"
                  required
                  {...register("title", { required: "Task title is required" })}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 focus:bg-white/[0.07] transition-all"
                />
              </div>
              {errors.title && (
                <p className="text-xs text-rose-400 font-bold mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Description</label>
              <div className="relative group">
                <span className="absolute top-3 left-4 text-slate-400 group-focus-within:text-violet-400 transition-colors">
                  <FaInfoCircle className="text-sm" />
                </span>
                <textarea
                  rows={3}
                  placeholder="Outline precise checklist requirements, edge cases, and expected outputs..."
                  {...register("description")}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 focus:bg-white/[0.07] transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Parent Project *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                  <FaProjectDiagram className="text-sm" />
                </span>
                <select
                  required
                  {...register("project_id", { required: "Project is required" })}
                  disabled={!!defaultProjectId}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 cursor-pointer transition-all disabled:opacity-50"
                >
                  <option value="" disabled className="bg-slate-950 text-slate-400">Select Project Scope</option>
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200">
                      {p.project_name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.project_id && (
                <p className="text-xs text-rose-400 font-bold mt-1">{errors.project_id.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Assigned Associate *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                  <FaUser className="text-sm" />
                </span>
                <select
                  required
                  {...register("assigned_to", { required: "Assignee is required" })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 cursor-pointer transition-all"
                >
                  <option value="" disabled className="bg-slate-950 text-slate-400">Select Operator</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-slate-950 text-slate-200">
                      {emp.full_name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
              {errors.assigned_to && (
                <p className="text-xs text-rose-400 font-bold mt-1">{errors.assigned_to.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Start Date</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <FaCalendarAlt className="text-sm" />
                  </span>
                  <input
                    type="date"
                    {...register("start_date")}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Due Date</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <FaCalendarAlt className="text-sm" />
                  </span>
                  <input
                    type="date"
                    {...register("due_date", {
                      validate: (val) => {
                        if (!val) return true;
                        if (!startDateWatch) return true;
                        return new Date(val) >= new Date(startDateWatch) || "Due date must exceed start date";
                      }
                    })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all"
                  />
                </div>
                {errors.due_date && (
                  <p className="text-xs text-rose-400 font-bold mt-1">{errors.due_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Priority *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <FaFlag className="text-xs" />
                  </span>
                  <select
                    required
                    {...register("priority", { required: "Priority is required" })}
                    className="w-full pl-9 pr-2 py-3 bg-slate-900 border border-white/5 rounded-2xl text-xs text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 cursor-pointer transition-all"
                  >
                    <option value="LOW" className="bg-slate-950 text-slate-200">Low</option>
                    <option value="MEDIUM" className="bg-slate-950 text-slate-200">Medium</option>
                    <option value="HIGH" className="bg-slate-950 text-slate-200">High</option>
                    <option value="CRITICAL" className="bg-slate-950 text-slate-200">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Status *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <FaChartLine className="text-xs" />
                  </span>
                  <select
                    required
                    {...register("status", { required: "Status is required" })}
                    className="w-full pl-9 pr-2 py-3 bg-slate-900 border border-white/5 rounded-2xl text-xs text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 cursor-pointer transition-all"
                  >
                    <option value="PENDING" className="bg-slate-950 text-slate-200">Pending</option>
                    <option value="IN_PROGRESS" className="bg-slate-950 text-slate-200">In Progress</option>
                    <option value="COMPLETED" className="bg-slate-950 text-slate-200">Completed</option>
                    <option value="ON_HOLD" className="bg-slate-950 text-slate-200">On Hold</option>
                    <option value="CANCELLED" className="bg-slate-950 text-slate-200">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Progress (%)</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <FaChartLine className="text-xs" />
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    {...register("completion_percentage", {
                      min: { value: 0, message: "Min is 0%" },
                      max: { value: 100, message: "Max is 100%" },
                    })}
                    className="w-full pl-9 pr-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 focus:bg-white/[0.07] transition-all"
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
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-2xl text-xs transition-colors disabled:opacity-50 cursor-pointer text-glow shadow-md shadow-violet-500/20"
              >
                {loading ? "Saving..." : initialData ? "Save Blueprint" : "Deploy Task"}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default TaskModal;
