import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getTasks, updateTask } from "../../services/taskService";
import { createExpense } from "../../services/expenseService";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/tables/DataTable";
import EmptyState from "../../components/common/EmptyState";
import { FaClock, FaCheckCircle, FaSpinner, FaEdit, FaTimes, FaComment, FaUser, FaMoneyBill, FaEye, FaSearch } from "react-icons/fa";
import TaskDetailsModal from "../../components/modals/TaskDetailsModal";
import ExpenseModal from "../../components/modals/ExpenseModal";
import { AnimatePresence } from "framer-motion";
import TableSearch from "../../components/tables/TableSearch";

function MyTaskPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [updateItem, setUpdateItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [expensePreselectedTask, setExpensePreselectedTask] = useState(null);
  const [status, setStatus] = useState("PENDING");
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  // Filter tasks assigned to this employee
  const myTasks = tasks?.filter((t) => t.assigned_to === user?.id) || [];

  const filteredTasks = myTasks.filter((task) => {
    const query = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.project_name?.toLowerCase().includes(query) ||
      task.assigned_by_name?.toLowerCase().includes(query)
    );
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      setExpensePreselectedTask(null);
      toast.success("Expense claim filed successfully for the task");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to file expense claim");
    },
  });

  const handleExpenseSubmit = (formData) => {
    createExpenseMutation.mutate(formData);
  };

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
      CRITICAL: "bg-red-500/10 text-red-600 border-red-500/20",
      HIGH: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      MEDIUM: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      LOW: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    };
    return colors[priority] || "bg-slate-500/10 text-slate-600 border-slate-500/20";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
            My Tasks
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Track milestones and update completion progress of your delegated assignments</p>
        </div>

        {/* Search Field */}
        <TableSearch
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
        />
      </div>

      {myTasks.length === 0 ? (
        <EmptyState
          title="All Caught Up!"
          description="You currently have no tasks assigned to you. Enjoy your day or consult with your manager for new allocations."
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No Matching Tasks"
          description="No tasks match your search query. Try typing another title, project, or supervisor."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setViewItem(task)}
              className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer border border-[var(--border-color)]/60"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="p-2 bg-[var(--accent-blue)]/10 rounded-xl flex-shrink-0">
                      {getStatusIcon(task.status)}
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)] tracking-tight text-md line-clamp-2 leading-tight pr-1" title={task.title}>
                      {task.title}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase border flex-shrink-0 ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>

                {/* Metadata */}
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <span className="font-semibold">Project:</span>
                    <span className="font-bold text-[var(--text-primary)] truncate max-w-[180px]">{task.project_name || "Internal"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] font-semibold">Assigned By:</span>
                    <div className="flex items-center gap-1 font-bold text-[var(--accent-purple)] bg-[var(--accent-purple)]/5 px-2 py-0.5 rounded-lg border border-[var(--accent-purple)]/10">
                      <FaUser className="text-[10px]" />
                      <span>{task.assigned_by_name || "System/Admin"}</span>
                    </div>
                  </div>
                </div>

                {/* Description Snippet */}
                <p className="text-sm text-[var(--text-secondary)] line-clamp-3 min-h-[4.5rem]" title={task.description}>
                  {task.description || "No specific details were logged for this assignment."}
                </p>
              </div>

              {/* Progress & Actions */}
              <div className="mt-6 pt-4 border-t border-[var(--border-color)] space-y-4">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                    <span>Task Progress</span>
                    <span className="text-[var(--accent-blue)]">{task.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-[var(--text-secondary)]/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        task.status === "COMPLETED" ? "bg-emerald-500" : "bg-[var(--accent-blue)]"
                      }`}
                      style={{ width: `${task.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Due Date & Status text */}
                <div className="flex justify-between items-center text-2xs pt-1">
                  <span className="font-bold text-[var(--text-secondary)] flex items-center gap-1 bg-[var(--bg-primary)]/40 p-2 rounded-xl border border-[var(--border-color)]">
                    <FaClock className="text-[var(--accent-blue)]" /> Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "â€”"}
                  </span>
                  <span className="font-bold text-[var(--text-secondary)] capitalize flex items-center gap-1 bg-[var(--bg-primary)]/40 p-2 rounded-xl border border-[var(--border-color)]">
                    Status: <span className="text-[var(--text-primary)] font-bold">{task.status?.toLowerCase().replace("_", " ")}</span>
                  </span>
                </div>

                {/* Compact Row of 2 Actions */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {task.status === "COMPLETED" ? (
                    <button
                      type="button"
                      disabled
                      className="py-2.5 bg-slate-100 text-slate-500 rounded-xl text-2xs font-extrabold tracking-wide uppercase flex items-center justify-center gap-1.5 border border-slate-200 cursor-not-allowed"
                      title="Task Completed & Locked"
                    >
                      <FaCheckCircle className="text-[10px] text-emerald-500" /> Completed
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUpdateItem(task);
                        setStatus(task.status || "PENDING");
                        setProgress(task.completion_percentage || 0);
                      }}
                      className="py-2.5 bg-[var(--accent-blue)]/10 hover:bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] rounded-xl text-2xs font-extrabold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 border border-[var(--accent-blue)]/20 cursor-pointer focus:outline-none"
                      title="Log Progress"
                    >
                      <FaEdit className="text-[10px]" /> Log Progress
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpensePreselectedTask(task);
                    }}
                    className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-xl text-2xs font-extrabold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 border border-emerald-500/20 cursor-pointer focus:outline-none"
                    title="Add Expense"
                  >
                    <FaMoneyBill className="text-[10px]" /> Add Expense
                  </button>
                </div>

                {/* Full-width View Task Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewItem(task);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <FaEye className="text-[11px]" /> View Task Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {updateItem && (
        <div className="fixed inset-0 z-50 bg-slate-800/40 flex justify-center items-center p-4">
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

      <ExpenseModal
        isOpen={!!expensePreselectedTask}
        onClose={() => setExpensePreselectedTask(null)}
        onSubmit={handleExpenseSubmit}
        loading={createExpenseMutation.isPending}
        preselectedTask={expensePreselectedTask}
      />
    </div>
  );
}

export default MyTaskPage;


