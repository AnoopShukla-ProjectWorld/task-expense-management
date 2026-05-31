import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FaArrowLeft, FaTasks, FaCalendarAlt, FaUser, 
  FaFlag, FaInfoCircle, FaSpinner, FaCloudUploadAlt, FaFilePdf, 
  FaProjectDiagram, FaCheckCircle, FaHourglassHalf
} from "react-icons/fa";
import { createTask } from "../../services/taskService";
import { getProjects } from "../../services/projectService";
import { getUsers } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const TaskCreatePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      description: "",
      project_id: "",
      assigned_to: "",
      start_date: "",
      due_date: "",
      priority: "MEDIUM",
    }
  });

  // Fetch all projects to filter those managed by this manager
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const managerProjects = projects?.filter(
    (p) => p.assigned_manager_id === user?.id
  ) || [];

  // Fetch employees list
  const { data: employees } = useQuery({
    queryKey: ["users", "EMPLOYEE"],
    queryFn: () => getUsers({ role: "EMPLOYEE" }),
  });

  // Watch fields for live visual roadmap rendering on the right panel
  const watchTitle = watch("title");
  const watchDesc = watch("description");
  const watchProject = watch("project_id");
  const watchAssignee = watch("assigned_to");
  const watchStart = watch("start_date");
  const watchDue = watch("due_date");
  const watchPriority = watch("priority");

  const selectedProjectName = managerProjects.find(
    (p) => String(p.id) === String(watchProject)
  )?.project_name || "Unselected Project";

  const selectedAssigneeName = employees?.find(
    (emp) => String(emp.id) === String(watchAssignee)
  )?.full_name || "Unassigned Operator";

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files || e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== "application/pdf") {
        toast.error("Only PDF documents are supported for task guidelines.");
        return;
      }
      setAttachedFile(file);
      toast.success(`Guideline PDF loaded: ${file.name}`);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      if (data.project_id) {
        formData.append("project_id", parseInt(data.project_id));
      }
      formData.append("assigned_to", parseInt(data.assigned_to));
      formData.append("assigned_by", user?.id);
      formData.append("priority", data.priority || "MEDIUM");
      formData.append("status", "PENDING");
      formData.append("completion_percentage", 0);
      
      if (data.start_date) formData.append("start_date", data.start_date);
      if (data.due_date) formData.append("due_date", data.due_date);
      
      if (attachedFile) {
        formData.append("document", attachedFile);
      }

      await createTask(formData);
      toast.success("Task deployed successfully!");
      navigate("/manager/tasks", { state: { activeTab: "teamTasks" } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deploy task");
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
        <button
          onClick={() => navigate("/manager/tasks", { state: { activeTab: "teamTasks" } })}
          className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer shadow-sm focus:outline-none"
        >
          <FaArrowLeft className="text-sm" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Deploy Task Blueprint
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Create precise operational tasks, delegate to qualified employees, and attach target guidelines files.
          </p>
        </div>
      </div>

      {/* Main split work grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel: Form Details (High density layout) */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 space-y-5 glass-panel p-6 sm:p-8 border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
          
          {/* Parent Project Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Parent Project Scope (Optional)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <FaProjectDiagram className="text-sm" />
              </span>
              <select
                {...register("project_id")}
                className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all font-semibold cursor-pointer appearance-none"
              >
                <option value="">General Task (No Project Bound)</option>
                {managerProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Task Title *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <FaTasks className="text-sm" />
              </span>
              <input
                type="text"
                autoComplete="off"
                placeholder="Database replication sync review"
                {...register("title", { required: "Task title is required" })}
                className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all font-semibold"
              />
            </div>
            {errors.title && (
              <p className="text-xs text-rose-500 font-semibold mt-0.5">{errors.title.message}</p>
            )}
          </div>

          {/* Scope Guidelines Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Guidelines & Scope Checklist</label>
            <div className="relative">
              <span className="absolute top-3.5 left-4 text-slate-400">
                <FaInfoCircle className="text-sm" />
              </span>
              <textarea
                rows={3}
                placeholder="Provide details on deliverables, guidelines, and expected results..."
                {...register("description")}
                className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all resize-none font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* Associate Assignee & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Assign Associate *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FaUser className="text-sm" />
                </span>
                <select
                  {...register("assigned_to", { required: "Assignee is required" })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all font-semibold cursor-pointer appearance-none"
                >
                  <option value="">Select Employee</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
              {errors.assigned_to && (
                <p className="text-xs text-rose-500 font-semibold mt-0.5">{errors.assigned_to.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Priority Badge *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FaFlag className="text-sm" />
                </span>
                <select
                  {...register("priority", { required: "Priority level is required" })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all font-semibold cursor-pointer appearance-none"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="CRITICAL">Critical Priority</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dates Sync */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Start Date</label>
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
                    validate: (val) => {
                      if (!val) return true;
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
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Due Date Deadline</label>
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
                  {...register("due_date", {
                    validate: (val) => {
                      if (!val || !watchStart) return true;
                      return new Date(val) >= new Date(watchStart) || "Due date cannot be before start date";
                    }
                  })}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all font-semibold"
                />
              </div>
              {errors.due_date && (
                <p className="text-xs text-rose-500 font-semibold mt-0.5">{errors.due_date.message}</p>
              )}
            </div>
          </div>

          {/* Guideline PDF Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Instruction / Guidelines Document</label>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="relative border border-dashed border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-all rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer text-center group"
            >
              <input 
                type="file"
                accept="application/pdf"
                onChange={handleFileDrop}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {attachedFile ? (
                <div className="flex items-center gap-3 text-sm font-bold text-[var(--accent-indigo)]">
                  <FaFilePdf className="text-2xl text-rose-500" />
                  <span>{attachedFile.name}</span>
                </div>
              ) : (
                <>
                  <FaCloudUploadAlt className="text-2xl text-slate-400 group-hover:text-[var(--accent-indigo)] transition-colors mb-1.5" />
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Drag & drop or Click to upload PDF specification</span>
                  <span className="text-[10px] text-slate-400 mt-1">Accepts standard PDF guidelines up to 10MB</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]/60">
            <button
              type="button"
              onClick={() => navigate("/manager/tasks", { state: { activeTab: "teamTasks" } })}
              className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all cursor-pointer focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : (
                <span>Deploy Blueprint</span>
              )}
            </button>
          </div>
        </form>

        {/* Right Panel: Stunning visual roadmap / timeline Gantt preview */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Gantt & Node Operations Roadmap</h4>
          
          <div className="glass-panel border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-lg relative overflow-hidden rounded-2xl">
            {/* Solid top accent line */}
            <div className="h-1 w-full bg-blue-600" />
            
            {/* Solid color header bar covering the top section */}
            <div className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] px-6 py-4 flex justify-between items-center">
              <div className="space-y-1">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${getPriorityColor(watchPriority)}`}>
                  {watchPriority} Priority
                </span>
                <h3 className="text-sm font-extrabold text-[var(--text-primary)] pt-1 truncate max-w-[200px]">
                  {watchTitle || "Task Operations Mockup"}
                </h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <FaTasks className="text-xs" />
              </div>
            </div>

            {/* Container contents */}
            <div className="p-6 space-y-6">
              {/* Gantt / Node Operations Roadmap Flow */}
              <div className="space-y-6 relative py-2 pl-4">
                {/* Connecting vertical workflow timeline line */}
                <div className="absolute top-4 bottom-4 left-[9px] w-0.5 bg-slate-200" />

                {/* Node 1: Project Scope Allocation */}
                <div className="relative flex gap-3.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] text-slate-500 z-10">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-[var(--text-primary)]">Project Bound</h5>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate max-w-[240px] font-medium">
                      {selectedProjectName}
                    </p>
                  </div>
                </div>

                {/* Node 2: Employee Operations Launch */}
                <div className="relative flex gap-3.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--accent-indigo)]/30 flex items-center justify-center text-[10px] text-[var(--accent-indigo)] z-10">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-[var(--text-primary)]">Assigned Operator</h5>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate max-w-[240px] font-semibold">
                      {selectedAssigneeName}
                    </p>
                  </div>
                </div>

                {/* Node 3: Execution Timeline Scope */}
                <div className="relative flex gap-3.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] text-slate-500 z-10">
                    3
                  </div>
                  <div className="space-y-0.5 w-full">
                    <h5 className="text-xs font-bold text-[var(--text-primary)]">Operational Timeline</h5>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-[var(--text-secondary)] font-bold">
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded">
                        {watchStart ? new Date(watchStart).toLocaleDateString("en-IN") : "No Start"}
                      </span>
                      <span>➔</span>
                      <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-[var(--accent-indigo)] rounded">
                        {watchDue ? new Date(watchDue).toLocaleDateString("en-IN") : "Indefinite"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary description preview */}
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic line-clamp-2 min-h-[2.5rem] pt-2 border-t border-[var(--border-color)]/60">
                {watchDesc || "Enter task description scope to preview guidelines live..."}
              </p>

              {/* Spec attachment link display */}
              {attachedFile && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <FaFilePdf className="text-rose-500 text-lg" />
                    <span className="truncate max-w-[180px]">{attachedFile.name}</span>
                  </div>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Attached</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskCreatePage;
