import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";
import TableLoader from "../../components/loaders/TableLoader";
import EmptyState from "../../components/common/EmptyState";
import { FaProjectDiagram, FaCalendarAlt, FaDollarSign, FaUserTie } from "react-icons/fa";

function ProjectsPage() {
  const { user } = useAuth();
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
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
              className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
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
                    <span>Project Progress</span>
                    <span className="text-[var(--accent-blue)]">{project.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-[var(--text-secondary)]/10 rounded-full h-2">
                    <div
                      className="bg-[var(--accent-blue)] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Timelines and Budget */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="flex flex-col gap-0.5 bg-[var(--bg-primary)]/40 p-2 rounded-xl border border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-1">
                      <FaCalendarAlt className="text-[var(--accent-blue)]" /> Dates
                    </span>
                    <span className="text-[var(--text-primary)] font-bold">
                      {new Date(project.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} - 
                      {project.end_date ? ` ${new Date(project.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : " Ongoing"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 bg-[var(--bg-primary)]/40 p-2 rounded-xl border border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-1">
                      <FaDollarSign className="text-[var(--accent-blue)]" /> Budget
                    </span>
                    <span className="text-[var(--text-primary)] font-bold truncate">
                      {project.budget ? `$${parseFloat(project.budget).toLocaleString()}` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
