import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FaTasks, FaPlusCircle, FaComment, FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { getTasks, createTask, updateTask, deleteTask } from "../../services/taskService";
import { getProjects } from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/tables/DataTable";
import TaskModal from "../../components/modals/TaskModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import TaskDetailsModal from "../../components/modals/TaskDetailsModal";

function TeamTaskPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  // Fetch all tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  // Fetch all projects to identify which ones are managed by this manager
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const managerProjectIds = projects
    ?.filter((p) => p.assigned_manager_id === user?.id)
    .map((p) => p.id) || [];

  const teamTasks = tasks?.filter((t) => managerProjectIds.includes(t.project_id)) || [];

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      setIsModalOpen(false);
      toast.success("Task created successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create task");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      setIsModalOpen(false);
      setEditingTask(null);
      toast.success("Task updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update task");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      setDeleteId(null);
      toast.success("Task deleted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete task");
    },
  });

  const handleSubmit = (data) => {
    // Add manager's user id as the one assigning the task
    const taskData = {
      ...data,
      assigned_by: user?.id,
    };
    
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: taskData });
    } else {
      createMutation.mutate(taskData);
    }
  };

  const columns = [
    { key: "title", title: "Task Title" },
    {
      key: "project_name",
      title: "Project",
      render: (row) => row.project_name || "—",
    },
    {
      key: "assigned_to_name",
      title: "Assigned Employee",
      render: (row) => row.assigned_to_name || "—",
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide border ${
          row.status === "COMPLETED"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
            : row.status === "IN_PROGRESS"
            ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]"
            : row.status === "ON_HOLD"
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
            : row.status === "CANCELLED"
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
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
          <div className="w-16 bg-white/5 border border-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
              style={{ width: `${row.completion_percentage}%` }}
            />
          </div>
          <span className="text-2xs font-bold text-slate-400">
            {row.completion_percentage}%
          </span>
        </div>
      ),
    },
    {
      key: "due_date",
      title: "Due Date",
      render: (row) => (row.due_date ? new Date(row.due_date).toLocaleDateString() : "—"),
    },
    {
      key: "actions",
      title: "Task Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingTask(row); setIsModalOpen(true); }}
            className="px-2.5 py-1.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            className="px-2.5 py-1.5 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Delete
          </button>
          <button
            onClick={() => setViewItem(row)}
            className="px-2.5 py-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
          >
            <FaComment /> Discuss
          </button>
        </div>
      ),
    },
  ];

  const isLoading = tasksLoading || projectsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <FaTasks className="text-blue-500 text-2xl" />
            Team Tasks
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Assign, delegate, and manage tasks for employees in your projects</p>
        </div>
        {managerProjectIds.length > 0 && (
          <Button 
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg"
          >
            <FaPlusCircle />
            Create Task
          </Button>
        )}
      </div>

      {managerProjectIds.length === 0 ? (
        <EmptyState
          title="No Projects Assigned"
          description="You are not assigned as a manager for any active projects. Assigning projects enables team task delegation."
        />
      ) : teamTasks.length === 0 ? (
        <div className="space-y-6">
          <EmptyState
            title="No Tasks Delegated"
            description="You haven't assigned any tasks for employees on your managed projects yet. Click 'Create Task' to get started."
          />
          <TaskModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
            onSubmit={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
            initialData={editingTask}
          />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={teamTasks}
            loading={isLoading}
            actions={false}
            onEdit={(row) => { setEditingTask(row); setIsModalOpen(true); }}
            onDelete={(id) => setDeleteId(id)}
          />

          <TaskModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
            onSubmit={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
            initialData={editingTask}
          />

          {deleteId && (
            <ConfirmDialog
              title="Delete Task"
              description="Are you sure you want to permanently delete this task? This action cannot be undone."
              onCancel={() => setDeleteId(null)}
              onConfirm={() => deleteMutation.mutate(deleteId)}
            />
          )}

          <AnimatePresence>
            {viewItem && (
              <TaskDetailsModal 
                task={viewItem} 
                onClose={() => setViewItem(null)} 
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default TeamTaskPage;

