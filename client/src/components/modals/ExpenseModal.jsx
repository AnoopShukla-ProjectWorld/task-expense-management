import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaTags, FaCalendarAlt, FaInfoCircle, FaProjectDiagram, FaUser } from "react-icons/fa";
import { getTasks } from "../../services/taskService";
import { getProjects } from "../../services/projectService";
import { getUsers } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import FileUpload from "../common/FileUpload";

function ExpenseModal({ isOpen, onClose, onSubmit, loading, initialData, preselectedTask }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [receiptFile, setReceiptFile] = useState(null);
  const { user } = useAuth();

  const taskIdValue = watch("task_id");
  const categoryValue = watch("category");

  // Fetch tasks to link expenses to them if needed (only for employees/non-managers)
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
    enabled: isOpen && user?.role?.toUpperCase() !== "MANAGER",
  });

  const employeeTasks = tasks.filter(t => t.assigned_to === user?.id);

  // Fetch projects to link expenses to them if user is a manager
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
    enabled: isOpen && user?.role?.toUpperCase() === "MANAGER",
  });

  const managerProjects = projects.filter(p => p.assigned_manager_id === user?.id);

  // Fetch users to filter active managers for general routing (only for employees/non-managers to select)
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
    enabled: isOpen && user?.role?.toUpperCase() === "EMPLOYEE",
  });

  const managers = users.filter(u => u.role?.toUpperCase() === "MANAGER");
  const selectedTask = employeeTasks?.find(t => t.id === parseInt(taskIdValue));

  useEffect(() => {
    if (isOpen) {
      setReceiptFile(null);
      
      if (preselectedTask) {
        reset({
          amount: "",
          category: "HARDWARE",
          custom_category: "",
          expense_date: new Date().toISOString().split("T")[0],
          description: `Expense claim for task: ${preselectedTask.title}`,
          task_id: preselectedTask.id || "",
          project_id: preselectedTask.project_id || "",
          assigned_manager_id: preselectedTask.assigned_by || "",
        });
      } else if (initialData) {
        const expenseDate = initialData.expense_date
          ? new Date(initialData.expense_date).toISOString().split("T")[0]
          : "";

        const standardCategories = ["HARDWARE", "SOFTWARE_LICENSE", "TRAVEL_TRAVEL", "MEALS_REFRESHMENT", "TRAINING_MEMBERSHIP"];
        const isCustom = initialData.category && !standardCategories.includes(initialData.category);

        reset({
          amount: initialData.amount || "",
          category: isCustom ? "OTHER" : (initialData.category || "HARDWARE"),
          custom_category: isCustom ? initialData.category : "",
          expense_date: expenseDate,
          description: initialData.description || "",
          task_id: initialData.task_id || "",
          project_id: initialData.project_id || "",
          assigned_manager_id: initialData.assigned_manager_id || "",
        });
      } else {
        reset({
          amount: "",
          category: "HARDWARE",
          custom_category: "",
          expense_date: "",
          description: "",
          task_id: "",
          project_id: "",
          assigned_manager_id: "",
        });
      }
    }
  }, [initialData, preselectedTask, isOpen, reset]);

  if (!isOpen) return null;

  const handleFileDrop = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setReceiptFile(acceptedFiles[0]);
    }
  };

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    formData.append("amount", parseFloat(data.amount));
    
    // Custom category override if OTHER is selected
    const categoryName = data.category === "OTHER" ? data.custom_category : data.category;
    formData.append("category", categoryName);
    
    formData.append("expense_date", data.expense_date);
    if (data.description) {
      formData.append("description", data.description);
    }
    
    const isManager = user?.role?.toUpperCase() === "MANAGER";
    
    if (preselectedTask) {
      formData.append("task_id", preselectedTask.id);
      if (preselectedTask.project_id) {
        formData.append("project_id", preselectedTask.project_id);
      }
      if (!isManager && preselectedTask.assigned_by) {
        formData.append("assigned_manager_id", preselectedTask.assigned_by);
      }
    } else if (isManager) {
      // Manager's own expense: no task_id, but can optionally link a project they manage
      if (data.project_id) {
        formData.append("project_id", parseInt(data.project_id));
      }
    } else if (data.task_id) {
      formData.append("task_id", parseInt(data.task_id));
      const linkedTask = employeeTasks?.find(t => t.id === parseInt(data.task_id));
      if (linkedTask?.project_id) {
        formData.append("project_id", linkedTask.project_id);
      }
      if (linkedTask?.assigned_by) {
        formData.append("assigned_manager_id", linkedTask.assigned_by);
      }
    } else if (data.assigned_manager_id) {
      formData.append("assigned_manager_id", parseInt(data.assigned_manager_id));
    }
    
    if (receiptFile) {
      formData.append("receipt", receiptFile);
    }
    onSubmit(formData);
  };

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
          <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center mb-6 relative">
            <div>
              <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
                {initialData ? "Modify Expense Entry" : "File Expense Claim"}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">Report receipts, amounts, categories, and client billing</p>
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
              <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Amount (₹) *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] group-focus-within:text-emerald-400 transition-colors font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  required
                  autoComplete="off"
                  {...register("amount", {
                    required: "Expense amount is required",
                    min: { value: 1, message: "Amount must be at least ₹1" }
                  })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:bg-[var(--bg-secondary)] transition-all"
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-rose-400 font-bold mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Category *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                    <FaTags className="text-sm" />
                  </span>
                  <select
                    required
                    {...register("category", { required: "Category is required" })}
                    className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all focus:bg-[var(--bg-secondary)]"
                  >
                    <option value="HARDWARE" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Hardware & Equipment</option>
                    <option value="SOFTWARE_LICENSE" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Software Licenses & SaaS</option>
                    <option value="TRAVEL_TRAVEL" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Travel & Transport</option>
                    <option value="MEALS_REFRESHMENT" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Meals & Refreshments</option>
                    <option value="TRAINING_MEMBERSHIP" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Training & Memberships</option>
                    <option value="OTHER" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Other / Custom</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Expense Date *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                    <FaCalendarAlt className="text-sm" />
                  </span>
                  <input
                    type="date"
                    required
                    {...register("expense_date", { required: "Date is required" })}
                    className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all focus:bg-[var(--bg-secondary)]"
                  />
                </div>
                {errors.expense_date && (
                  <p className="text-xs text-rose-400 font-bold mt-1">{errors.expense_date.message}</p>
                )}
              </div>
            </div>

            {/* Custom Category Input Override */}
            {categoryValue === "OTHER" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Custom Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Internet Bills, Equipment, Software"
                  required
                  {...register("custom_category", { required: "Custom category name is required" })}
                  className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:bg-[var(--bg-secondary)] transition-all"
                />
                {errors.custom_category && (
                  <p className="text-xs text-rose-400 font-bold mt-1">{errors.custom_category.message}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Reason / Description</label>
              <div className="relative group">
                <span className="absolute top-3 left-4 text-[var(--text-secondary)] group-focus-within:text-emerald-400 transition-colors">
                  <FaInfoCircle className="text-sm" />
                </span>
                <textarea
                  rows={2}
                  placeholder="Outline client details, business targets, or purchase contexts..."
                  {...register("description")}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:bg-[var(--bg-secondary)] transition-all resize-none"
                />
              </div>
            </div>

            {user?.role?.toUpperCase() === "MANAGER" ? (
              // ─── Manager View: Link Project (Optional) and NO Approving Manager field ───
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Link Project (Optional)</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                    <FaProjectDiagram className="text-sm" />
                  </span>
                  <select
                    {...register("project_id")}
                    className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all focus:bg-[var(--bg-secondary)]"
                  >
                    <option value="" className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">General Expense (No Project)</option>
                    {managerProjects?.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                        {p.project_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : preselectedTask ? (
              // ─── Employee View (with preselectedTask) ───
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Linked Task</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                      <FaProjectDiagram className="text-sm" />
                    </span>
                    <input
                      type="text"
                      disabled
                      value={preselectedTask.title}
                      className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)]/70 outline-none cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Approving Manager</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                      <FaUser className="text-sm" />
                    </span>
                    <input
                      type="text"
                      disabled
                      value={preselectedTask.assigned_by_name || "Assigned Task Manager"}
                      className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)]/70 outline-none cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>
              </>
            ) : (
              // ─── Employee View (Standard) ───
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Link Task (Optional)</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                      <FaProjectDiagram className="text-sm" />
                    </span>
                    <select
                      {...register("task_id")}
                      className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all focus:bg-[var(--bg-secondary)]"
                    >
                      <option value="" className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">General Expense (No Task)</option>
                      {employeeTasks?.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {taskIdValue ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Approving Manager</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                        <FaUser className="text-sm" />
                      </span>
                      <input
                        type="text"
                        disabled
                        value={selectedTask?.assigned_by_name || "Assigned Task Manager"}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)]/70 outline-none cursor-not-allowed font-semibold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Select Approving Manager *</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-secondary)] pointer-events-none">
                        <FaUser className="text-sm" />
                      </span>
                      <select
                        {...register("assigned_manager_id", { required: !taskIdValue && user?.role?.toUpperCase() !== "MANAGER" ? "Please select a manager to route this claim" : false })}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all focus:bg-[var(--bg-secondary)]"
                      >
                        <option value="" className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">Choose Approver...</option>
                        {managers.map((m) => (
                          <option key={m.id} value={m.id} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                            {m.full_name || `${m.first_name} ${m.last_name}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.assigned_manager_id && (
                      <p className="text-xs text-rose-400 font-bold mt-1">{errors.assigned_manager_id.message}</p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase mb-1">Receipt Attachment</label>
              <FileUpload onDrop={handleFileDrop} selectedFile={receiptFile} />
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
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl text-xs transition-colors disabled:opacity-50 cursor-pointer text-glow shadow-md shadow-emerald-500/20"
              >
                {loading ? "Filing..." : initialData ? "Modify Claim" : "File Claim"}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ExpenseModal;
