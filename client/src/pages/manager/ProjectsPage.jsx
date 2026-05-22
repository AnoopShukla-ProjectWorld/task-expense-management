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
      CRITICAL: "bg-red-50 text-red-700 border-red-200",
      HIGH: "bg-orange-50 text-orange-700 border-orange-200",
      MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
      LOW: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return colors[priority] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
      COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
      ON_HOLD: "bg-amber-100 text-amber-800 border-amber-200",
      PLANNED: "bg-slate-100 text-slate-800 border-slate-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (isLoading) return <TableLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Projects</h1>
        <p className="text-gray-500">Oversee and monitor progress of projects allocated to you</p>
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
              className="bg-white rounded-2xl border border-gray-150 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <FaProjectDiagram />
                    </div>
                    <h3 className="font-bold text-gray-800 tracking-tight text-lg line-clamp-1">
                      {project.project_name}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase border ${getStatusBadgeColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Priority:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 line-clamp-3 min-h-[4.5rem]">
                  {project.description || "No project description provided."}
                </p>
              </div>

              {/* Progress & Metadata */}
              <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>Project Progress</span>
                    <span className="text-blue-600">{project.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Timelines and Budget */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="flex flex-col gap-0.5 bg-gray-50 p-2 rounded-xl border border-gray-100/50">
                    <span className="text-gray-400 font-semibold flex items-center gap-1">
                      <FaCalendarAlt /> Dates
                    </span>
                    <span className="text-gray-700 font-bold">
                      {new Date(project.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} - 
                      {project.end_date ? ` ${new Date(project.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : " Ongoing"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 bg-gray-50 p-2 rounded-xl border border-gray-100/50">
                    <span className="text-gray-400 font-semibold flex items-center gap-1">
                      <FaDollarSign /> Budget
                    </span>
                    <span className="text-gray-700 font-bold truncate">
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
