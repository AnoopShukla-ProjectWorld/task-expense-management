import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getTasks, createTask, updateTask, deleteTask } from "../../services/taskService";
import DataTable from "../../components/tables/DataTable";
import TaskModal from "../../components/modals/TaskModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Button from "../../components/common/Button";
import { motion, AnimatePresence } from "framer-motion";
import { FaList, FaThLarge, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaComment } from "react-icons/fa";
import TaskDetailsModal from "../../components/modals/TaskDetailsModal";

function TasksPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list', 'kanban', 'calendar'

  // Calendar state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
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
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Kanban setup
  const statuses = ["TODO", "IN_PROGRESS", "ON_HOLD", "COMPLETED"];
  const columnNames = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    ON_HOLD: "On Hold",
    COMPLETED: "Completed"
  };

  // Calendar dates math
  const startDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
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
      title: "Assigned To",
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

  return (
    <div className="space-y-6">
      {/* Upper Header Control panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Tasks Management</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Track, allocate, and manage tasks across projects</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Segmented View Mode Picker */}
          <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
              title="List View"
            >
              <FaList />
              <span className="hidden md:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                viewMode === "kanban"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Kanban Board"
            >
              <FaThLarge />
              <span className="hidden md:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                viewMode === "calendar"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Calendar View"
            >
              <FaCalendarAlt />
              <span className="hidden md:inline">Calendar</span>
            </button>
          </div>

          <Button onClick={() => { setEditingTask(null); setIsModalOpen(true); }}>
            Create Task
          </Button>
        </div>
      </div>

      {/* Conditional Rendering of Views */}
      {viewMode === "list" && (
        <DataTable
          columns={columns}
          data={tasks || []}
          loading={isLoading}
          actions={false}
          onEdit={(row) => { setEditingTask(row); setIsModalOpen(true); }}
          onDelete={(id) => setDeleteId(id)}
        />
      )}

      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statuses.map(status => {
            const statusTasks = (tasks || []).filter(t => t.status === status);
            return (
              <div key={status} className="glass-panel p-4 rounded-3xl flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h3 className="font-bold text-sm tracking-wide text-white">{columnNames[status]}</h3>
                  <span className="text-xs px-2.5 py-0.5 bg-white/5 border border-white/5 rounded-full font-bold text-slate-300">{statusTasks.length}</span>
                </div>
                <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[550px] pr-1 scrollbar-thin">
                  {statusTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 py-12">
                      Empty column
                    </div>
                  ) : (
                    statusTasks.map(task => (
                      <motion.div
                        whileHover={{ y: -2, scale: 1.02 }}
                        key={task.id}
                        onClick={() => setViewItem(task)}
                        className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3 group hover:border-blue-500/25 transition-all cursor-pointer relative shadow-sm"
                      >
                        <h4 className="font-bold text-xs text-white">{task.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{task.description || "No description provided."}</p>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                          <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No limit"}</span>
                          <span className="font-semibold text-blue-400">{task.assigned_to_name || "Unassigned"}</span>
                        </div>
                        
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-white/5 mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsModalOpen(true); }}
                            className="px-2.5 py-1 bg-white/5 hover:bg-blue-600/20 text-blue-400 border border-white/5 hover:border-blue-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(task.id); }}
                            className="px-2.5 py-1 bg-white/5 hover:bg-rose-600/20 text-rose-400 border border-white/5 hover:border-rose-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <h3 className="font-bold text-lg text-white">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs text-white transition-all cursor-pointer">
                <FaChevronLeft />
              </button>
              <button onClick={nextMonth} className="p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs text-white transition-all cursor-pointer">
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-28 bg-slate-950/20 border border-transparent rounded-2xl" />;
              }
              
              const dateStr = new Date(currentYear, currentMonth, day).toDateString();
              const dayTasks = (tasks || []).filter(t => t.due_date && new Date(t.due_date).toDateString() === dateStr);

              return (
                <div key={`day-${day}`} className="h-28 p-2.5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-white/10 hover:border-blue-500/20 transition-all">
                  <span className="text-xs font-bold text-slate-400">{day}</span>
                  <div className="flex-1 overflow-y-auto space-y-1 mt-1.5 scrollbar-none">
                    {dayTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={(e) => { e.stopPropagation(); setViewItem(t); }}
                        className="px-2 py-1 text-[9px] font-bold bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg cursor-pointer truncate transition-all hover:bg-blue-600 hover:text-white"
                        title={t.title}
                      >
                        {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
    </div>
  );
}

export default TasksPage;