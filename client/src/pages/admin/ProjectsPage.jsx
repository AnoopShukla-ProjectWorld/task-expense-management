import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaUser,
  FaChartLine,
  FaInfoCircle,
  FaBriefcase,
  FaCoins,
  FaChevronRight
} from "react-icons/fa";
import { getProjects, createProject, updateProject, deleteProject } from "../../services/projectService";
import ProjectModal from "../../components/modals/ProjectModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Button from "../../components/common/Button";
import TableSearch from "../../components/tables/TableSearch";

// Elegant skeleton pulse loaders for premium UX shimmers
const ProjectCardSkeleton = () => (
  <div className="glass-panel p-6 border border-[var(--border-color)] space-y-4 animate-pulse relative overflow-hidden bg-[var(--bg-secondary)] min-h-[340px] flex flex-col justify-between">
    <div className="absolute top-0 left-0 w-2 h-full bg-slate-300/30" />
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="h-5.5 w-16 bg-slate-200/50 dark:bg-slate-700/50 rounded-xl" />
        <div className="h-5.5 w-20 bg-slate-200/50 dark:bg-slate-700/50 rounded-xl" />
      </div>
      <div className="h-6 w-3/4 bg-slate-200/60 dark:bg-slate-700/60 rounded-xl mt-3" />
      <div className="space-y-2 mt-3">
        <div className="h-3.5 w-full bg-slate-200/40 dark:bg-slate-700/40 rounded-lg" />
        <div className="h-3.5 w-5/6 bg-slate-200/40 dark:bg-slate-700/40 rounded-lg" />
      </div>
    </div>
    
    <div className="space-y-4.5 mt-4">
      {/* Grid metadata */}
      <div className="grid grid-cols-2 gap-3 py-2 bg-[var(--bg-tertiary)]/10 rounded-xl px-2">
        <div className="h-8 bg-slate-200/30 dark:bg-slate-700/30 rounded-lg" />
        <div className="h-8 bg-slate-200/30 dark:bg-slate-700/30 rounded-lg" />
      </div>
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between"><div className="h-3 w-16 bg-slate-200/40 dark:bg-slate-700/40 rounded" /><div className="h-3 w-8 bg-slate-200/40 dark:bg-slate-700/40 rounded" /></div>
        <div className="h-2 w-full bg-slate-200/30 dark:bg-slate-700/30 rounded-full" />
      </div>
    </div>
    
    <div className="flex justify-end gap-2 mt-5 pt-3.5 border-t border-[var(--border-color)]/20">
      <div className="h-8 w-16 bg-slate-200/40 dark:bg-slate-700/40 rounded-xl" />
      <div className="h-8 w-16 bg-slate-200/40 dark:bg-slate-700/40 rounded-xl" />
    </div>
  </div>
);

function ProjectsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", search],
    queryFn: () => getProjects({ search, limit: 10000 }),
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsModalOpen(false);
      toast.success("Project created successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create project");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsModalOpen(false);
      setEditingProject(null);
      toast.success("Project updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update project");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteId(null);
      toast.success("Project deleted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete project");
    },
  });

  const handleSubmit = (data) => {
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-IN', options);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Projects Fleet</h1>
          <p className="text-[var(--text-secondary)] text-sm">Deploy, manage, and audit corporate deliverables and resource scopes</p>
        </div>
        <Button 
          onClick={() => navigate("/admin/projects/new")}
          className="flex items-center gap-2 font-bold px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md shadow-blue-500/10 active:scale-95 transition-all text-sm shrink-0 cursor-pointer"
        >
          <FaBriefcase className="text-xs" />
          Create Project
        </Button>
      </div>

      {/* Filter and Search Action Frame */}
      <div className="flex items-center justify-between gap-4 py-1">
        <TableSearch
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
        />
      </div>

      {/* Main Container Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      ) : projects?.length === 0 ? (
        <div className="glass-panel p-12 text-center border border-[var(--border-color)] flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto mt-6 bg-[var(--bg-secondary)]">
          <div className="p-4 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-2xl border border-[var(--border-color)]">
            <FaInfoCircle className="text-3xl" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">No projects discovered</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs">
              We couldn't locate any active projects matching your current filters. Select "Create Project" to seed your database.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => {
            // Safe parsing of numbers to handle NULL database outputs
            const spent = parseFloat(project.budget_utilization || 0);
            const budgetVal = parseFloat(project.budget || 0);
            const percent = budgetVal > 0 ? Math.min(Math.round((spent / budgetVal) * 100), 100) : 0;
            
            // Dynamic theme variables for warning boundaries
            const borderColors = {
              CRITICAL: "border-l-4 border-l-rose-500",
              HIGH: "border-l-4 border-l-orange-500",
              MEDIUM: "border-l-4 border-l-violet-500",
              LOW: "border-l-4 border-l-slate-400"
            };

            const statusStyles = {
              ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]",
              COMPLETED: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]",
              ON_HOLD: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]",
              CANCELLED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
              PLANNED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            };

            const priorityStyles = {
              CRITICAL: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.05)]",
              HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]",
              MEDIUM: "bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.05)]",
              LOW: "bg-slate-500/10 text-slate-400 border-slate-500/20"
            };

            const budgetWarningColors = 
              percent > 90 ? "text-rose-500" : percent > 60 ? "text-amber-500" : "text-emerald-500";
            const budgetWarningBgs = 
              percent > 90 ? "bg-rose-500" : percent > 60 ? "bg-amber-500" : "bg-emerald-500";

            return (
              <div 
                key={project.id} 
                className={`glass-panel glass-panel-hover p-6 border border-[var(--border-color)] relative flex flex-col justify-between overflow-hidden min-h-[340px] bg-[var(--bg-secondary)] ${borderColors[project.priority] || "border-l-4 border-l-slate-400"}`}
              >
                {/* Decorative background glow for ACTIVE projects */}
                {project.status === "ACTIVE" && (
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />
                )}
                {project.priority === "CRITICAL" && (
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-rose-500/5 blur-2xl pointer-events-none" />
                )}

                <div>
                  {/* Badges Row */}
                  <div className="flex justify-between items-center gap-2 mb-3.5">
                    <span className={`inline-flex justify-center items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border text-center shadow-sm shrink-0 ${statusStyles[project.status] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                      {project.status}
                    </span>
                    <span className={`inline-flex justify-center items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border text-center shadow-sm shrink-0 ${priorityStyles[project.priority] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                      {project.priority}
                    </span>
                  </div>

                  {/* Title & Scope description */}
                  <div className="space-y-1">
                    <h3 
                      className="text-lg font-bold text-[var(--text-primary)] hover:text-blue-500 transition-colors line-clamp-1 cursor-pointer flex items-center gap-1 group"
                      onClick={() => navigate(`/admin/projects/${project.id}`)}
                      title={project.project_name}
                    >
                      <span className="truncate">{project.project_name}</span>
                      <FaChevronRight className="text-[10px] text-[var(--text-secondary)]/30 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 min-h-[32px] leading-relaxed">
                      {project.description || "No specific project scope details allocated."}
                    </p>
                  </div>
                </div>

                <div className="mt-4.5 space-y-4">
                  {/* Metadata block (Manager & Target date) */}
                  <div className="grid grid-cols-2 gap-3 py-2.5 bg-[var(--bg-tertiary)]/20 border border-[var(--border-color)]/25 rounded-2xl px-3.5">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] min-w-0">
                      <FaUser className="text-[10px] text-blue-500/80 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)]/50">Manager</span>
                        <span className="text-[11px] font-black text-[var(--text-primary)] truncate" title={project.manager_name || "Unassigned"}>
                          {project.manager_name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] min-w-0">
                      <FaCalendarAlt className="text-[10px] text-purple-500/80 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)]/50">Timeline</span>
                        <span className="text-[11px] font-black text-[var(--text-primary)] truncate" title={formatDate(project.start_date)}>
                          {formatDate(project.start_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational physical progression */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-[var(--text-secondary)]/70 uppercase tracking-widest flex items-center gap-1">
                        <FaChartLine className="text-[9px] text-indigo-500" />
                        Completion
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-black px-1.5 py-0.25 rounded-md inline-block ${
                          project.manual_completion_percentage !== null 
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        }`}>
                          {project.manual_completion_percentage !== null ? "Manual" : "Auto-Sync"}
                        </span>
                        <span className="text-xs font-black text-[var(--text-primary)]">
                          {Math.round(project.completion_percentage || 0)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)]/30 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(Math.max(project.completion_percentage || 0, 0), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial burn audit */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-[var(--text-secondary)]/70 uppercase tracking-widest flex items-center gap-1">
                        <FaCoins className="text-[9px] text-amber-500" />
                        Budget Burn
                      </span>
                      {budgetVal > 0 ? (
                        <span className={`text-[10px] font-extrabold ${budgetWarningColors}`}>
                          {percent}% Used
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-450 tracking-wider">Uncapped Limit</span>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline leading-none">
                      <span className="text-[var(--text-primary)] font-black text-[13px]">
                        ₹{spent.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[var(--text-secondary)] text-[10px] font-medium">
                        of {budgetVal > 0 ? `₹${budgetVal.toLocaleString('en-IN')}` : "Unlimited"}
                      </span>
                    </div>
                    {budgetVal > 0 && (
                      <div className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)]/30 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${budgetWarningBgs}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action footer panel */}
                <div className="flex items-center justify-end gap-2 mt-5 pt-3.5 border-t border-[var(--border-color)]/40">
                  <button
                    onClick={() => { setEditingProject(project); setIsModalOpen(true); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer active:scale-95"
                  >
                    <FaEdit className="text-[10px]" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteId(project.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 hover:text-rose-600 transition-all cursor-pointer active:scale-95"
                  >
                    <FaTrash className="text-[10px]" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Interfaces mapping */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProject(null); }}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        initialData={editingProject}
      />

      {deleteId && (
        <ConfirmDialog
          title="Archive Project deliverable"
          description="Are you sure you want to archive this operational milestone? This will lock related employee task cards and hide its financial accounts from standard reports."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => deleteMutation.mutate(deleteId)}
        />
      )}
    </div>
  );
}

export default ProjectsPage;
