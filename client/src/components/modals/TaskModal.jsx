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

  // Fetch all active users dynamically for assignment select
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers({ limit: 10000 }),
    enabled: isOpen,
  });

  const activeUsers = users || [];
  const managers = activeUsers.filter((u) => u.role?.toLowerCase() === "manager");
  const employees = activeUsers.filter((u) => u.role?.toLowerCase() === "employee");

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
    let completionPercentage = parseInt(data.completion_percentage || 0);
    let status = data.status;

    if (status === "COMPLETED") {
      completionPercentage = 100;
    } else if (completionPercentage === 100) {
      status = "COMPLETED";
    }

    const payload = {
      ...data,
      project_id: data.project_id ? parseInt(data.project_id) : null,
      assigned_to: parseInt(data.assigned_to),
      status,
      completion_percentage: completionPercentage,
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
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-md cursor-pointer"
        />

        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-lg glass-panel rounded-3xl p-6.5 border border-[var(--border-color)] shadow-2xl relative overflow-hidden z-10 my-8"
        >
          {/* Decorative background ambient lighting */}
          <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center mb-6 relative">
            <div>
              <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
                {initialData ? "Edit Operation Blueprint" : "Initialize New Task"}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">Set tasks scopes, priorities, and assign operations</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 scrollbar-thin relative">
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Task Title *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] group-focus-within:text-violet-400 transition-colors">
                  <FaTasks className="text-sm" />
                </span>
                <input
                  type="text"
                  placeholder="Review Database Architecture"
                  required
                  autoComplete="off"
                  {...register("title", { required: "Task title is required" })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 focus:bg-[var(--bg-secondary)] transition-all"
                />
              </div>
              {errors.title && (
                <p className="text-xs text-rose-400 font-bold mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Description</label>
              <div className="relative group">
                <span className="absolute top-3 left-4 text-[var(--text-secondary)] group-focus-within:text-violet-400 transition-colors">
                  <FaInfoCircle className="text-sm" />
                </span>
                <textarea
                  rows={3}
                  placeholder="Outline precise checklist requirements, edge cases, and expected outputs..."
                  {...register("description")}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 focus:bg-[var(--bg-secondary)] transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Parent Project *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                  <FaProjectDiagram className="text-sm" />
                </span>
                <select
                  {...register("project_id")}
                  disabled={!!defaultProjectId}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 cursor-pointer transition-all disabled:opacity-50 focus:bg-[var(--bg-secondary)]"
                >
                  <option value="" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">General Task (No Project Bound)</option>
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
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
              <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Assigned Associate *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                  <FaUser className="text-sm" />
                </span>
                <select
                  required
                  {...register("assigned_to", { required: "Assignee is required" })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 cursor-pointer transition-all focus:bg-[var(--bg-secondary)]"
                >
                  <option value="" disabled className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">Select Associate</option>
                  {managers.length > 0 && (
                    <optgroup label="Managers">
                      {managers.map((m) => (
                        <option key={m.id} value={m.id} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                          💼 {m.full_name} ({m.email})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {employees.length > 0 && (
                    <optgroup label="Employees">
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                          👤 {emp.full_name} ({emp.email})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              {errors.assigned_to && (
                <p className="text-xs text-rose-400 font-bold mt-1">{errors.assigned_to.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Start Date</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                    <FaCalendarAlt className="text-sm" />
                  </span>
                  <input
                    type="date"
                    min={(() => {
                      if (initialData?.start_date) {
                        try {
                          return new Date(initialData.start_date).toISOString().split("T")[0];
                        } catch (e) {}
                      }
                      const d = new Date();
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    })()}
                    {...register("start_date", {
                      validate: (val) => {
                        if (!val) return true;
                        if (!initialData) {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const selected = new Date(val);
                          selected.setHours(0, 0, 0, 0);
                          return selected >= today || "Start date cannot be in the past";
                        }
                        return true;
                      }
                    })}
                    className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all focus:bg-[var(--bg-secondary)]"
                  />
                </div>
                {errors.start_date && (
                  <p className="text-xs text-rose-400 font-bold mt-1">{errors.start_date.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Due Date</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                    <FaCalendarAlt className="text-sm" />
                  </span>
                  <input
                    type="date"
                    min={startDateWatch || (() => {
                      const d = new Date();
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    })()}
                    {...register("due_date", {
                      validate: (val) => {
                        if (!val) return true;
                        if (!startDateWatch) return true;
                        return new Date(val) >= new Date(startDateWatch) || "Due date must exceed start date";
                      }
                    })}
                    className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all focus:bg-[var(--bg-secondary)]"
                  />
                </div>
                {errors.due_date && (
                  <p className="text-xs text-rose-400 font-bold mt-1">{errors.due_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Priority *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--text-secondary)] pointer-events-none">
                    <FaFlag className="text-xs" />
                  </span>
                  <select
                    required
                    {...register("priority", { required: "Priority is required" })}
                    className="w-full pl-9 pr-2 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-xs text-[var(--text-primary)] outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 cursor-pointer transition-all focus:bg-[var(--bg-secondary)]"
                  >
                    <option value="LOW" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Low</option>
                    <option value="MEDIUM" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Medium</option>
                    <option value="HIGH" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">High</option>
                    <option value="CRITICAL" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Status *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--text-secondary)] pointer-events-none">
                    <FaChartLine className="text-xs" />
                  </span>
                  <select
                    required
                    {...register("status", { required: "Status is required" })}
                    className="w-full pl-9 pr-2 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-xs text-[var(--text-primary)] outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 cursor-pointer transition-all focus:bg-[var(--bg-secondary)]"
                  >
                    <option value="PENDING" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Pending</option>
                    <option value="IN_PROGRESS" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">In Progress</option>
                    <option value="COMPLETED" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Completed</option>
                    <option value="ON_HOLD" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">On Hold</option>
                    <option value="CANCELLED" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Progress (%)</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--text-secondary)] pointer-events-none">
                    <FaChartLine className="text-xs" />
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    autoComplete="off"
                    {...register("completion_percentage", {
                      min: { value: 0, message: "Min is 0%" },
                      max: { value: 100, message: "Max is 100%" },
                    })}
                    className="w-full pl-9 pr-2 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 focus:bg-[var(--bg-secondary)] transition-all"
                  />
                </div>
                {errors.completion_percentage && (
                  <p className="text-xs text-rose-400 font-bold mt-1">{errors.completion_percentage.message}</p>
                )}
              </div>
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
