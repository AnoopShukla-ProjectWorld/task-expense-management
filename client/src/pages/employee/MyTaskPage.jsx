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
    const badges = {
      CRITICAL: "bg-red-50 text-red-700 border-red-200",
      HIGH: "bg-orange-50 text-orange-700 border-orange-200",
      MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
      LOW: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return badges[priority] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusIcon = (taskStatus) => {
    switch (taskStatus) {
      case "COMPLETED":
        return <FaCheckCircle className="text-emerald-500 text-lg" />;
      case "IN_PROGRESS":
        return <FaSpinner className="text-blue-500 text-lg animate-spin" />;
      case "ON_HOLD":
        return <FaClock className="text-amber-500 text-lg" />;
      default:
        return <FaClock className="text-gray-400 text-lg" />;
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
          <div className="w-24 bg-gray-150 rounded-full h-2 border border-gray-200/50">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                row.status === "COMPLETED" ? "bg-emerald-500" : "bg-blue-600"
              }`}
              style={{ width: `${row.completion_percentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-600">{row.completion_percentage}%</span>
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
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-blue-150 cursor-pointer"
          >
            <FaEdit /> Log Progress
          </button>
          <button
            onClick={() => setViewItem(row)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-150 cursor-pointer"
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
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-gray-500">Track milestones and update completion progress of your delegated assignments</p>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Log Task Progress</h2>
              <button
                type="button"
                onClick={() => setUpdateItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100/50">
              <span className="text-2xs font-semibold text-gray-400 uppercase">Task Name</span>
              <p className="font-bold text-gray-700 leading-tight mt-0.5">{updateItem.title}</p>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700">Workflow Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setStatus(newStatus);
                    if (newStatus === "COMPLETED") {
                      setProgress(100);
                    }
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-bold text-gray-750">
                  <label>Completion Level</label>
                  <span className="text-blue-600">{progress}%</span>
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
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUpdateItem(null)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
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
