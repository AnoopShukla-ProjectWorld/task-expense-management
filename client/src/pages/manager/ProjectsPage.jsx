import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjects, updateProject } from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";
import TableLoader from "../../components/loaders/TableLoader";
import EmptyState from "../../components/common/EmptyState";
import ProjectDetailsModal from "../../components/modals/ProjectDetailsModal";
import { AnimatePresence } from "framer-motion";
import { FaProjectDiagram, FaCalendarAlt, FaRupeeSign, FaUserTie, FaEye, FaEdit, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

function ProjectsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState(null);
  const [updateProjectItem, setUpdateProjectItem] = useState(null);
  const [projectStatus, setProjectStatus] = useState("ACTIVE");
  const [projectProgress, setProjectProgress] = useState(0);
  const [progressMode, setProgressMode] = useState("AUTO");
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
      setUpdateProjectItem(null);
      toast.success("Project progress updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update project progress");
    },
  });

  const handleProjectUpdateSubmit = (e) => {
    e.preventDefault();
    setIsUpdatingProject(true);

    const payload = {
      project_name: updateProjectItem.project_name,
      assigned_manager_id: updateProjectItem.assigned_manager_id,
      start_date: updateProjectItem.start_date,
      end_date: updateProjectItem.end_date,
      priority: updateProjectItem.priority,
      budget: updateProjectItem.budget,
      status: projectStatus,
      manual_completion_percentage: progressMode === "AUTO" ? null : parseInt(projectProgress),
    };

    updateMutation.mutate(
      { id: updateProjectItem.id, data: payload },
      {
        onSettled: () => setIsUpdatingProject(false),
      }
    );
  };
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects({ limit: 10000 }),
  });

  // Filter projects assigned specifically to this manager
  const managerProjects = projects?.filter(
    (p) => p.assigned_manager_id === user?.id
  ) || [];

  const getPriorityColor = (priority) => {
    const colors = {
      CRITICAL: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      HIGH: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      MEDIUM: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      LOW: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    };
    return colors[priority] || "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      COMPLETED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      ON_HOLD: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      PLANNED: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    };
    return colors[status] || "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  };

  if (isLoading) return <TableLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
          My Projects
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Oversee and monitor progress of projects allocated to you</p>
      </div>

      {managerProjects.length === 0 ? (
        <EmptyState
          title="No Assigned Projects"
          description="You are currently not assigned as a manager for any active projects. Contact the administration team to assign you to a project."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managerProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer border border-[var(--border-color)]/60"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] rounded-xl">
                      <FaProjectDiagram />
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)] tracking-tight text-lg line-clamp-1">
                      {project.project_name}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase border ${getStatusBadgeColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Priority:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] line-clamp-3 min-h-[4.5rem]">
                  {project.description || "No project description provided."}
                </p>
              </div>

              {/* Progress & Metadata */}
              <div className="mt-6 pt-4 border-t border-[var(--border-color)] space-y-4">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1.5">
                      Project Progress
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        project.manual_completion_percentage !== null 
                          ? "bg-amber-100 text-amber-700 border border-amber-200" 
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}>
                        {project.manual_completion_percentage !== null ? "Manual" : "Auto-Sync"}
                      </span>
                    </span>
                    <span className="text-[var(--accent-blue)]">{project.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-[var(--text-secondary)]/10 rounded-full h-2">
                    <div
                      className="bg-[var(--accent-blue)] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Budget Utilization Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                    <span>Budget Utilized</span>
                    <span className={Number(project.budget) > 0 && (Number(project.budget_utilization) / Number(project.budget) * 100) > 90 ? "text-rose-500" : Number(project.budget) > 0 && (Number(project.budget_utilization) / Number(project.budget) * 100) > 60 ? "text-amber-500" : "text-emerald-500"}>
                      {Number(project.budget) > 0 ? Math.min(Math.round((Number(project.budget_utilization) / Number(project.budget)) * 100), 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-[var(--text-secondary)]/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        Number(project.budget) > 0 && (Number(project.budget_utilization) / Number(project.budget) * 100) > 90 ? "bg-rose-500" : Number(project.budget) > 0 && (Number(project.budget_utilization) / Number(project.budget) * 100) > 60 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Number(project.budget) > 0 ? Math.min(Math.round((Number(project.budget_utilization) / Number(project.budget)) * 100), 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Timelines and Budget Summary */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="flex flex-col gap-0.5 bg-[var(--bg-primary)]/40 p-2 rounded-xl border border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-1 text-[10px]">
                      <FaCalendarAlt className="text-[var(--accent-blue)]" /> Dates
                    </span>
                    <span className="text-[var(--text-primary)] font-bold text-xs truncate">
                      {new Date(project.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} - 
                      {project.end_date ? ` ${new Date(project.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : " Ongoing"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 bg-[var(--bg-primary)]/40 p-2 rounded-xl border border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-1 text-[10px]">
                      <FaRupeeSign className="text-[var(--accent-blue)]" /> Budget Spent
                    </span>
                    <span className="text-[var(--text-primary)] font-bold text-xs truncate">
                      ₹{parseFloat(project.budget_utilization || 0).toLocaleString()} / {project.budget ? `₹${parseFloat(project.budget).toLocaleString()}` : "—"}
                    </span>
                  </div>
                </div>

                {/* Dual Action Buttons Row */}
                <div className="grid grid-cols-2 gap-3 mt-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUpdateProjectItem(project);
                      setProjectStatus(project.status || "ACTIVE");
                      setProjectProgress(project.completion_percentage || 0);
                      setProgressMode(project.manual_completion_percentage !== null ? "MANUAL" : "AUTO");
                    }}
                    className="py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-xl text-xs font-bold transition-all border border-indigo-500/20 hover:border-indigo-500/40 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    <FaEdit /> Log Progress
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(project);
                    }}
                    className="py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    <FaEye /> View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailsModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>

      {updateProjectItem && (
        <div className="fixed inset-0 z-50 bg-slate-800/50 flex justify-center items-center p-4">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Log Project Progress</h2>
              <button
                type="button"
                onClick={() => setUpdateProjectItem(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <div className="bg-[var(--bg-primary)]/40 rounded-xl p-3 mb-4 border border-[var(--border-color)]">
              <span className="text-2xs font-semibold text-[var(--text-secondary)] uppercase">Project Name</span>
              <p className="font-bold text-[var(--text-primary)] leading-tight mt-0.5">{updateProjectItem.project_name}</p>
            </div>

            <form onSubmit={handleProjectUpdateSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[var(--text-secondary)]">Status</label>
                <select
                  value={projectStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setProjectStatus(newStatus);
                    if (newStatus === "COMPLETED") {
                      setProgressMode("MANUAL");
                      setProjectProgress(100);
                    }
                  }}
                  className="w-full rounded-xl border border-[var(--border-color)] px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50 text-sm bg-[var(--bg-primary)]/40 text-[var(--text-primary)]"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[var(--text-secondary)]">Progress Mode</label>
                <select
                  value={progressMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setProgressMode(mode);
                    if (mode === "AUTO") {
                      setProjectProgress(updateProjectItem.completion_percentage || 0);
                    }
                  }}
                  className="w-full rounded-xl border border-[var(--border-color)] px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50 text-sm bg-[var(--bg-primary)]/40 text-[var(--text-primary)]"
                >
                  <option value="AUTO">🔄 Sync with Tasks (Auto-Calculate)</option>
                  <option value="MANUAL">✍️ Manual Override</option>
                </select>
              </div>

              {progressMode === "MANUAL" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm font-bold text-[var(--text-secondary)]">
                    <label className="text-[var(--text-primary)]">Completion Percentage</label>
                    <span className="text-[var(--accent-blue)]">{projectProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={projectProgress}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setProjectProgress(val);
                      if (val === 100) {
                        setProjectStatus("COMPLETED");
                      } else if (val > 0 && projectStatus === "PLANNED") {
                        setProjectStatus("ACTIVE");
                      }
                    }}
                    className="w-full h-1.5 bg-[var(--text-secondary)]/20 rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)] focus:outline-none"
                  />
                </div>
              ) : (
                <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] text-blue-600 font-medium leading-relaxed">
                  ✨ The project progress will be calculated dynamically based on the average completion percentage of all tasks linked to this project.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setUpdateProjectItem(null)}
                  className="px-4 py-2.5 border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-primary)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProject}
                  className="px-5 py-2.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/80 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-[var(--accent-blue)]/10 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingProject ? "Saving..." : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;

