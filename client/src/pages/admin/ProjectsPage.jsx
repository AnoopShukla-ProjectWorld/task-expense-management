import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getProjects, createProject, updateProject, deleteProject } from "../../services/projectService";
import DataTable from "../../components/tables/DataTable";
import ProjectModal from "../../components/modals/ProjectModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Button from "../../components/common/Button";

function ProjectsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
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
      queryClient.invalidateQueries(["projects"]);
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
      queryClient.invalidateQueries(["projects"]);
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

  const columns = [
    { key: "project_name", title: "Project Name" },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide border ${
          row.status === "ACTIVE"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
            : row.status === "COMPLETED"
            ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]"
            : row.status === "ON_HOLD"
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "priority",
      title: "Priority",
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide border ${
          row.priority === "CRITICAL"
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
            : row.priority === "HIGH"
            ? "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]"
            : row.priority === "MEDIUM"
            ? "bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.05)]"
            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }`}>
          {row.priority}
        </span>
      ),
    },
    {
      key: "completion_percentage",
      title: "Progress",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-24 bg-white/5 border border-white/5 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
              style={{ width: `${row.completion_percentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-400">
            {row.completion_percentage}%
          </span>
        </div>
      ),
    },
    {
      key: "budget",
      title: "Budget",
      render: (row) => (row.budget ? `₹${parseFloat(row.budget).toLocaleString()}` : "—"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Projects Management</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Create and oversee all enterprise projects and high-level milestones</p>
        </div>
        <Button onClick={() => { setEditingProject(null); setIsModalOpen(true); }}>
          Create Project
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={projects || []}
        loading={isLoading}
        actions={true}
        onEdit={(row) => { setEditingProject(row); setIsModalOpen(true); }}
        onDelete={(id) => setDeleteId(id)}
      />

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProject(null); }}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        initialData={editingProject}
      />

      {deleteId && (
        <ConfirmDialog
          title="Delete Project"
          description="Are you sure you want to delete this project? This will archive all its related tasks and historical records."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => deleteMutation.mutate(deleteId)}
        />
      )}
    </div>
  );
}

export default ProjectsPage;