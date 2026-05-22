import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getTasks, updateTask } from "../../services/taskService";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/tables/DataTable";
import EmptyState from "../../components/common/EmptyState";
import { FaClock, FaCheckCircle, FaSpinner, FaEdit, FaTimes, FaComment } from "react-icons/fa";
import TaskDetailsModal from "../../components/modals/TaskDetailsModal";
import { AnimatePresence } from "framer-motion";

function MyTaskPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [updateItem, setUpdateItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [status, setStatus] = useState("PENDING");
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  // Filter tasks assigned to this employee
  const myTasks = tasks?.filter((t) => t.assigned_to === user?.id) || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      setUpdateItem(null);
      toast.success("Task progress updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update task progress");
    },
  });

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...updateItem,
      status,
      completion_percentage: parseInt(progress),
    };

    updateMutation.mutate(
      { id: updateItem.id, data: payload },
      {
        onSettled: () => setIsSubmitting(false),
      }
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      CRITICAL: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      HIGH: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      MEDIUM: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      LOW: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    };
    return colors[priority] || "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  };

  const getStatusIcon = (taskStatus) => {
    switch (taskStatus) {
      case "COMPLETED":
        return <FaCheckCircle className="text-emerald-500 text-lg" />;
      case "IN_PROGRESS":
        return <FaSpinner className="text-[var(--accent-blue)] text-lg animate-spin" />;
      case "ON_HOLD":
        return <FaClock className="text-amber-500 text-lg" />;
      default:
        return <FaClock className="text-[var(--text-secondary)] text-lg" />;
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
      key: "priority",
      title: "Priority",
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border ${getPriorityBadge(row.priority)}`}>
          {row.priority}
        </span>
      ),
    },
    {
      key: "due_date",
      title: "Due Date",
      render: (row) => (row.due_date ? new Date(row.due_date).toLocaleDateString() : "—"),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          {getStatusIcon(row.status)}
          <span className="capitalize">{row.status?.toLowerCase().replace("_", " ")}</span>
        </div>
      ),
    },
    {
      key: "completion_percentage",
      title: "Progress Meter",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-24 bg-[var(--text-secondary)]/10 rounded-full h-2 border border-[var(--border-color)]">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                row.status === "COMPLETED" ? "bg-emerald-500" : "bg-[var(--accent-blue)]"
              }`}
              style={{ width: `${row.completion_percentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[var(--text-secondary)]">{row.completion_percentage}%</span>
        </div>
      ),
    },
    {
      key: "actions",
      title: "Task Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setUpdateItem(row);
              setStatus(row.status || "PENDING");
              setProgress(row.completion_percentage || 0);
            }}
            className="px-3 py-1.5 bg-[var(--accent-blue)]/10 hover:bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-[var(--accent-blue)]/20 hover:border-[var(--accent-blue)]/40 cursor-pointer"
          >
            <FaEdit /> Log Progress
          </button>
          <button
            onClick={() => setViewItem(row)}
            className="px-3 py-1.5 bg-[var(--accent-purple)]/10 hover:bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-[var(--accent-purple)]/20 hover:border-[var(--accent-purple)]/40 cursor-pointer"
          >
            <FaComment /> Discuss
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
          My Tasks
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Track milestones and update completion progress of your delegated assignments</p>
      </div>

      {myTasks.length === 0 ? (
        <EmptyState
          title="All Caught Up!"
          description="You currently have no tasks assigned to you. Enjoy your day or consult with your manager for new allocations."
        />
      ) : (
        <DataTable
          columns={columns}
          data={myTasks}
          loading={isLoading}
          actions={false}
        />
      )}

      {updateItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Log Task Progress</h2>
              <button
                type="button"
                onClick={() => setUpdateItem(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <div className="bg-[var(--bg-primary)]/40 rounded-xl p-3 mb-4 border border-[var(--border-color)]">
              <span className="text-2xs font-semibold text-[var(--text-secondary)] uppercase">Task Name</span>
              <p className="font-bold text-[var(--text-primary)] leading-tight mt-0.5">{updateItem.title}</p>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[var(--text-secondary)]">Workflow Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setStatus(newStatus);
                    if (newStatus === "COMPLETED") {
                      setProgress(100);
                    }
                  }}
                  className="w-full rounded-xl border border-[var(--border-color)] px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50 text-sm bg-[var(--bg-primary)]/40 text-[var(--text-primary)]"
                >
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="PENDING">Pending</option>
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="IN_PROGRESS">In Progress</option>
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="COMPLETED">Completed</option>
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="ON_HOLD">On Hold</option>
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-bold text-[var(--text-secondary)]">
                  <label className="text-[var(--text-primary)]">Completion Level</label>
                  <span className="text-[var(--accent-blue)]">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setProgress(val);
                    if (val === 100) {
                      setStatus("COMPLETED");
                    } else if (val > 0 && status === "PENDING") {
                      setStatus("IN_PROGRESS");
                    }
                  }}
                  className="w-full h-1.5 bg-[var(--text-secondary)]/20 rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setUpdateItem(null)}
                  className="px-4 py-2.5 border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-primary)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/80 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-[var(--accent-blue)]/10 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {viewItem && (
          <TaskDetailsModal 
            task={viewItem} 
            onClose={() => setViewItem(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default MyTaskPage;
