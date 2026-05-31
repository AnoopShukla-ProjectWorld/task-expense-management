import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaTasks, FaPlusCircle, FaComment, FaEdit, FaTrash, 
  FaClock, FaCheckCircle, FaSpinner, FaUser, FaMoneyBill, 
  FaEye, FaTimes, FaInbox, FaFolderOpen 
} from "react-icons/fa";
import toast from "react-hot-toast";
import { getTasks, createTask, updateTask, deleteTask } from "../../services/taskService";
import { getProjects } from "../../services/projectService";
import { createExpense } from "../../services/expenseService";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/tables/DataTable";
import TaskModal from "../../components/modals/TaskModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import TaskDetailsModal from "../../components/modals/TaskDetailsModal";
import ExpenseModal from "../../components/modals/ExpenseModal";
import TableSearch from "../../components/tables/TableSearch";

function TeamTaskPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "myTasks"); // 'myTasks', 'teamTasks'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // States for logging personal task progress
  const [updateItem, setUpdateItem] = useState(null);
  const [status, setStatus] = useState("PENDING");
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expensePreselectedTask, setExpensePreselectedTask] = useState(null);

  // Fetch all tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks({ limit: 10000 }),
  });

  // Fetch all projects to identify which ones are managed by this manager
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const managerProjectIds = projects
    ?.filter((p) => p.assigned_manager_id === user?.id)
    .map((p) => p.id) || [];

  // Filter 1: Tasks assigned directly to this manager
  const myTasks = tasks?.filter((t) => t.assigned_to === user?.id) || [];

  // Filter 2: Tasks belonging to projects managed by this manager
  const teamTasks = tasks?.filter((t) => managerProjectIds.includes(t.project_id)) || [];

  const tabs = [
    { id: "myTasks", label: "My Tasks", icon: <FaInbox />, desc: `Perform your own tasks (${myTasks.length})` },
    { id: "teamTasks", label: "Team Tasks", icon: <FaFolderOpen />, desc: `Delegate tasks to your team (${teamTasks.length})` },
  ];

  // Filtered views based on search bar
  const filteredMyTasks = myTasks.filter((task) => {
    const q = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.project_name?.toLowerCase().includes(q) ||
      task.assigned_by_name?.toLowerCase().includes(q)
    );
  });

  const filteredTeamTasks = teamTasks.filter((task) => {
    const q = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.project_name?.toLowerCase().includes(q) ||
      task.assigned_to_name?.toLowerCase().includes(q)
    );
  });

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
      setUpdateItem(null);
      toast.success("Task progress updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update task progress");
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

  const handleSubmit = (data) => {
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

  const handleExpenseSubmit = (formData) => {
    createExpenseMutation.mutate(formData);
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      CRITICAL: "bg-red-500/10 text-red-600 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]",
      HIGH: "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]",
      MEDIUM: "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]",
      LOW: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    };
    return colors[priority] || "bg-slate-500/10 text-slate-600 border-slate-500/20";
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
        return <FaClock className="text-[var(--text-secondary)] text-lg" />;
    }
  };

  // Table columns definition for Team Tasks Tab
  const teamColumns = [
    { key: "title", title: "Task Title" },
    {
      key: "project_name",
      title: "Project Binding",
      render: (row) => row.project_name || "General (No Project Bound)",
    },
    {
      key: "assigned_to_name",
      title: "Assigned Associate",
      render: (row) => row.assigned_to_name || "—",
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <span className={`inline-flex justify-center items-center w-32 px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide border text-center shadow-sm ${
          row.status === "COMPLETED"
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            : row.status === "IN_PROGRESS"
            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
            : row.status === "ON_HOLD"
            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
            : row.status === "CANCELLED"
            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
            : "bg-slate-500/10 text-slate-600 border-slate-500/20"
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "priority",
      title: "Priority",
      render: (row) => (
        <span className={`inline-flex justify-center items-center w-24 px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide border text-center shadow-sm ${
          row.priority === "CRITICAL"
            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
            : row.priority === "HIGH"
            ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
            : row.priority === "MEDIUM"
            ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
            : "bg-slate-500/10 text-slate-600 border-slate-500/20"
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
          <div className="w-16 bg-slate-200 border border-slate-300 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
              style={{ width: `${row.completion_percentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-600">
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
      title: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingTask(row); setIsModalOpen(true); }}
            className="px-2.5 py-1.5 bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            className="px-2.5 py-1.5 bg-rose-600/10 border border-rose-500/30 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Delete
          </button>
          <button
            onClick={() => setViewItem(row)}
            className="px-2.5 py-1.5 bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
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
      
      {/* Header Panel */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
          <FaTasks className="text-blue-500 text-2xl" />
          Tasks Board (Manager)
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">Manage your team assignments or perform tasks directly assigned to you</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-3 border-b border-[var(--border-color)] pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer rounded-t-xl border border-b-0 -mb-px ${
              activeTab === tab.id
                ? "bg-[var(--bg-secondary)] border-[var(--border-color)] text-blue-600 shadow-sm"
                : "bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <span className={`text-base ${activeTab === tab.id ? "text-blue-500" : "text-[var(--text-secondary)]"}`}>
              {tab.icon}
            </span>
            <div className="text-left">
              <span className="block leading-tight">{tab.label}</span>
              <span className="text-[10px] font-normal text-[var(--text-secondary)] leading-tight hidden sm:block">
                {tab.desc}
              </span>
            </div>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents: My Tasks Tab */}
      {activeTab === "myTasks" && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex justify-between items-center">
            <TableSearch
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
            />
          </div>

          {myTasks.length === 0 ? (
            <EmptyState
              title="All Caught Up!"
              description="You currently have no tasks assigned to you by the administrator. Good job!"
            />
          ) : filteredMyTasks.length === 0 ? (
            <EmptyState
              title="No Results Found"
              description="No tasks match your search query."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMyTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setViewItem(task)}
                  className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer border border-[var(--border-color)]/60 bg-[var(--bg-secondary)] shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="p-2 bg-blue-500/10 rounded-xl flex-shrink-0">
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

                    <div className="space-y-2 text-xs pt-1">
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span className="font-semibold">Project Binding:</span>
                        <span className="font-bold text-[var(--text-primary)] truncate max-w-[180px]">{task.project_name || "General (No Project)"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)] font-semibold">Assigned By:</span>
                        <div className="flex items-center gap-1 font-bold text-violet-600 bg-violet-500/5 px-2 py-0.5 rounded-lg border border-violet-500/10">
                          <FaUser className="text-[10px]" />
                          <span>{task.assigned_by_name || "System/Admin"}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-[var(--text-secondary)] line-clamp-3 min-h-[4.5rem]" title={task.description}>
                      {task.description || "No specific details were logged for this assignment."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--border-color)] space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                        <span>Task Progress</span>
                        <span className="text-blue-600">{task.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-[var(--text-secondary)]/10 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            task.status === "COMPLETED" ? "bg-emerald-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${task.completion_percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-2xs pt-1">
                      <span className="font-bold text-[var(--text-secondary)] flex items-center gap-1 bg-[var(--bg-primary)]/40 p-2 rounded-xl border border-[var(--border-color)]">
                        <FaClock className="text-blue-500" /> Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                      </span>
                      <span className="font-bold text-[var(--text-secondary)] capitalize flex items-center gap-1 bg-[var(--bg-primary)]/40 p-2 rounded-xl border border-[var(--border-color)]">
                        Status: <span className="text-[var(--text-primary)] font-bold">{task.status?.toLowerCase().replace("_", " ")}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {task.status === "COMPLETED" ? (
                        <button
                          type="button"
                          disabled
                          className="py-2.5 bg-slate-100 text-slate-500 rounded-xl text-2xs font-extrabold tracking-wide uppercase flex items-center justify-center gap-1.5 border border-slate-200 cursor-not-allowed"
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
                          className="py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 rounded-xl text-2xs font-extrabold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 border border-blue-500/20 cursor-pointer focus:outline-none"
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
                      >
                        <FaMoneyBill className="text-[10px]" /> Add Expense
                      </button>
                    </div>

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
        </div>
      )}

      {/* Tab Contents: Team Tasks Tab */}
      {activeTab === "teamTasks" && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <TableSearch
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team tasks..."
            />
            {managerProjectIds.length > 0 && (
              <Button 
                onClick={() => navigate("/manager/tasks/new")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg cursor-pointer whitespace-nowrap"
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
            <EmptyState
              title="No Tasks Delegated"
              description="You haven't assigned any tasks for employees on your managed projects yet. Click 'Create Task' above to get started."
            />
          ) : filteredTeamTasks.length === 0 ? (
            <EmptyState
              title="No Results Found"
              description="No team tasks match your search query."
            />
          ) : (
            <DataTable
              columns={teamColumns}
              data={filteredTeamTasks}
              loading={isLoading}
              actions={false}
            />
          )}
        </div>
      )}

      {/* Shared Task Form Modal (Only for Team Tasks tab editing) */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        initialData={editingTask}
      />

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <ConfirmDialog
          title="Delete Task"
          description="Are you sure you want to permanently delete this task? This action cannot be undone."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => deleteMutation.mutate(deleteId)}
        />
      )}

      {/* Task Update Modal (Only for logging progress on personal tasks) */}
      {updateItem && (
        <div className="fixed inset-0 z-50 bg-slate-800/40 flex justify-center items-center p-4">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 bg-[var(--bg-secondary)] border border-[var(--border-color)]">
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
                  className="w-full h-1.5 bg-[var(--text-secondary)]/20 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Popup Modal */}
      <AnimatePresence>
        {viewItem && (
          <TaskDetailsModal 
            task={viewItem} 
            onClose={() => setViewItem(null)} 
          />
        )}
      </AnimatePresence>

      {/* Expense Modal (For task-expense binding on personal tasks) */}
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

export default TeamTaskPage;
