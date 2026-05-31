import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FaArrowLeft, FaProjectDiagram, FaCalendarAlt, FaUserTie, 
  FaFlag, FaInfoCircle, FaSpinner, FaCloudUploadAlt, FaFilePdf 
} from "react-icons/fa";
import { createProject } from "../../services/projectService";
import { getUsers } from "../../services/userService";
import toast from "react-hot-toast";

const ProjectCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      project_name: "",
      description: "",
      start_date: "",
      end_date: "",
      assigned_manager_id: "",
      priority: "MEDIUM",
      budget: "",
    }
  });

  // Fetch managers list
  const { data: managers } = useQuery({
    queryKey: ["users", "MANAGER"],
    queryFn: () => getUsers({ role: "MANAGER" }),
  });

  // Watch fields for live visual card rendering on the right panel
  const watchName = watch("project_name");
  const watchDesc = watch("description");
  const watchStart = watch("start_date");
  const watchEnd = watch("end_date");
  const watchManager = watch("assigned_manager_id");
  const watchPriority = watch("priority");
  const watchBudget = watch("budget");

  const selectedManagerName = managers?.find(
    (m) => String(m.id) === String(watchManager)
  )?.full_name || "Unassigned Lead";

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files || e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are supported for project specs.");
        return;
      }
      setAttachedFile(file);
      toast.success(`PDF specs loaded: ${file.name}`);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("project_name", data.project_name);
      formData.append("description", data.description || "");
      formData.append("start_date", data.start_date);
      if (data.end_date) formData.append("end_date", data.end_date);
      formData.append("assigned_manager_id", parseInt(data.assigned_manager_id));
      formData.append("priority", data.priority || "MEDIUM");
      if (data.budget) formData.append("budget", parseFloat(data.budget));
      
      if (attachedFile) {
        formData.append("document", attachedFile);
      }

      const response = await createProject(formData);
      if (response.success) {
        toast.success("Project launched successfully!");
        navigate("/admin/projects");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to launch project");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case "CRITICAL": return "text-rose-600 bg-rose-50 border-rose-100";
      case "HIGH": return "text-amber-600 bg-amber-50 border-amber-100";
      case "MEDIUM": return "text-blue-600 bg-blue-50 border-blue-100";
      default: return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Upper Navigation Title */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/projects"
          className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer shadow-sm"
        >
          <FaArrowLeft className="text-sm" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Launch Project Blueprint
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Create project scopes, allocate supervising managers, and upload specifications.
          </p>
        </div>
      </div>

      {/* Main split work grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel: Form Details (High density layout) */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 space-y-5 glass-panel p-6 sm:p-8 border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
          
          {/* Project Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Project Name *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <FaProjectDiagram className="text-sm" />
              </span>
              <input
                type="text"
                autoComplete="off"
                placeholder="Enterprise Core Upgrade"
                {...register("project_name", { required: "Project name is required" })}
                className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all font-semibold"
              />
            </div>
            {errors.project_name && (
              <p className="text-xs text-rose-500 font-semibold mt-0.5">{errors.project_name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Scope & Guidelines</label>
            <div className="relative">
              <span className="absolute top-3.5 left-4 text-slate-400">
                <FaInfoCircle className="text-sm" />
              </span>
              <textarea
                rows={3}
                placeholder="Detail project specifications, target milestones, and expectations..."
                {...register("description")}
                className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all resize-none font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* Date Picker Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Start Date *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FaCalendarAlt className="text-sm" />
                </span>
                <input
                  type="date"
                  autoComplete="off"
                  min={(() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  })()}
                  {...register("start_date", { 
                    required: "Start date is required",
                    validate: (val) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selected = new Date(val);
                      selected.setHours(0, 0, 0, 0);
                      return selected >= today || "Start date cannot be in the past";
                    }
                  })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all font-semibold"
                />
              </div>
              {errors.start_date && (
                <p className="text-xs text-rose-500 font-semibold mt-0.5">{errors.start_date.message}</p>
              )}
            </div>
 
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">End Target</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FaCalendarAlt className="text-sm" />
                </span>
                <input
                  type="date"
                  autoComplete="off"
                  min={watchStart || (() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  })()}
                  {...register("end_date", {
                    validate: (val) => {
                      if (!val || !watchStart) return true;
                      return new Date(val) >= new Date(watchStart) || "End target cannot be before start date";
                    }
                  })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all font-semibold"
                />
              </div>
              {errors.end_date && (
                <p className="text-xs text-rose-500 font-semibold mt-0.5">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Assigned Manager & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Project Lead *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FaUserTie className="text-sm" />
                </span>
                <select
                  {...register("assigned_manager_id", { required: "Lead assignment is required" })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all font-semibold cursor-pointer appearance-none"
                >
                  <option value="" className="text-slate-400">Select Supervisor</option>
                  {managers?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              {errors.assigned_manager_id && (
                <p className="text-xs text-rose-500 font-semibold mt-0.5">{errors.assigned_manager_id.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Priority *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FaFlag className="text-sm" />
                </span>
                <select
                  {...register("priority", { required: "Priority level is required" })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all font-semibold cursor-pointer appearance-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Budget Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Allocate Budget (₹)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  autoComplete="off"
                  step="0.01"
                  placeholder="50000"
                  {...register("budget", { min: { value: 0, message: "Budget must be positive" } })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all font-semibold"
                />
              </div>
              {errors.budget && (
                <p className="text-xs text-rose-500 font-semibold mt-0.5">{errors.budget.message}</p>
              )}
            </div>
          </div>

          {/* Document Drag & Drop - Full Row */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Project Specification Document</label>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="relative border border-dashed border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-all rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer text-center group"
            >
              <input 
                type="file"
                accept="application/pdf"
                onChange={handleFileDrop}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {attachedFile ? (
                <div className="flex items-center gap-2.5 text-xs font-bold text-[var(--accent-purple)]">
                  <FaFilePdf className="text-2xl text-rose-500" />
                  <span className="truncate max-w-[300px]">{attachedFile.name}</span>
                </div>
              ) : (
                <>
                  <FaCloudUploadAlt className="text-2xl text-slate-400 group-hover:text-[var(--accent-purple)] transition-colors mb-2" />
                  <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Drag & drop specifications PDF here</span>
                  <span className="text-[10px] text-[var(--text-secondary)] mt-1">or click to browse local files</span>
                </>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]/60">
            <Link
              to="/admin/projects"
              className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] text-white text-xs font-bold transition-all shadow-md shadow-[var(--accent-purple)]/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Launching...</span>
                </>
              ) : (
                <span>Launch Blueprint</span>
              )}
            </button>
          </div>
        </form>

        {/* Right Panel: Stunning visual card mockup preview */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Live Workspace Preview</h4>
          
          <div className="glass-panel p-6 border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-lg space-y-6 relative overflow-hidden">
            {/* Ambient accent top glow border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)]" />
            
            {/* Header info preview */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${getPriorityColor(watchPriority)}`}>
                  {watchPriority} Priority
                </span>
                <h3 className="text-base font-extrabold text-[var(--text-primary)] truncate max-w-[200px] pt-1">
                  {watchName || "Project Title Mockup"}
                </h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[var(--accent-purple)]">
                <FaProjectDiagram className="text-xs" />
              </div>
            </div>

            {/* Description scope preview */}
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic line-clamp-3 min-h-[4rem]">
              {watchDesc || "Enter description details on the form to preview the operational scope and blueprints live..."}
            </p>

            {/* Metas display */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]/60 text-xs font-medium text-[var(--text-secondary)]">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Supervisor Manager</p>
                <p className="font-bold text-[var(--text-primary)] mt-0.5 truncate">{selectedManagerName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Budget Allocation</p>
                <p className="font-bold text-[var(--text-primary)] mt-0.5">
                  {watchBudget ? `₹${parseFloat(watchBudget).toLocaleString("en-IN")}` : "₹0.00"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Commencement</p>
                <p className="font-bold text-[var(--text-primary)] mt-0.5">
                  {watchStart ? new Date(watchStart).toLocaleDateString("en-IN") : "-- / -- / ----"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">End Target</p>
                <p className="font-bold text-[var(--text-primary)] mt-0.5">
                  {watchEnd ? new Date(watchEnd).toLocaleDateString("en-IN") : "Indefinite"}
                </p>
              </div>
            </div>

            {/* Attachment preview display */}
            {attachedFile && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <FaFilePdf className="text-rose-500 text-lg" />
                  <span className="truncate max-w-[180px]">{attachedFile.name}</span>
                </div>
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Linked</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectCreatePage;
