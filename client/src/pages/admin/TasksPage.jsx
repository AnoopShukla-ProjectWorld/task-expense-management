import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getTasks, createTask, updateTask, deleteTask } from "../../services/taskService";
import DataTable from "../../components/tables/DataTable";
import TaskModal from "../../components/modals/TaskModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Button from "../../components/common/Button";
import TableSearch from "../../components/tables/TableSearch";
import { motion, AnimatePresence } from "framer-motion";
import { FaList, FaThLarge, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaComment } from "react-icons/fa";
import TaskDetailsModal from "../../components/modals/TaskDetailsModal";

function TasksPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list', 'kanban', 'calendar'
  const [search, setSearch] = useState("");

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
    queryFn: () => getTasks({ limit: 10000 }),
  });

  const filteredTasks = (tasks || []).filter((task) => {
    const q = search.toLowerCase();
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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

  const handleDragDropStatusChange = (taskId, newStatus) => {
    const task = tasks?.find(t => t.id === parseInt(taskId));
    if (!task) return;

    let targetStatus = newStatus;
    if (newStatus === "TODO") {
      targetStatus = "PENDING";
    }

    if (task.status === targetStatus) return;

    let completionPercentage = task.completion_percentage || 0;
    if (targetStatus === "COMPLETED") {
      completionPercentage = 100;
    } else if (targetStatus === "PENDING") {
      completionPercentage = 0;
    }

    const payload = {
      title: task.title,
      description: task.description || "",
      project_id: task.project_id ? parseInt(task.project_id) : null,
      assigned_to: parseInt(task.assigned_to),
      assigned_by: task.assigned_by,
      start_date: task.start_date,
      due_date: task.due_date,
      priority: task.priority || "MEDIUM",
      status: targetStatus,
      completion_percentage: completionPercentage
    };

    updateMutation.mutate({ id: task.id, data: payload });
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
        <span className={`inline-flex justify-center items-center w-32 px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide border text-center shadow-sm ${
          row.status === "COMPLETED"
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
            : row.status === "IN_PROGRESS"
            ? "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]"
            : row.status === "ON_HOLD"
            ? "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
            : row.status === "CANCELLED"
            ? "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
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
            ? "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
            : row.priority === "HIGH"
            ? "bg-orange-500/10 text-orange-600 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]"
            : row.priority === "MEDIUM"
            ? "bg-violet-500/10 text-violet-600 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.05)]"
            : "bg-slate-500/10 text-slate-600 border-slate-500/20"
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
          <div className="flex p-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-extrabold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="List View"
            >
              <FaList />
              <span className="hidden md:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                viewMode === "kanban"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-extrabold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Kanban Board"
            >
              <FaThLarge />
              <span className="hidden md:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                viewMode === "calendar"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-extrabold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Calendar View"
            >
              <FaCalendarAlt />
              <span className="hidden md:inline">Calendar</span>
            </button>
          </div>
 
          <Button onClick={() => navigate("new")}>
            Create Task
          </Button>
        </div>
      </div>
 
      {/* Dynamic Search Box */}
      <TableSearch
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tasks by title, project, assignee..."
      />
 
      {/* Conditional Rendering of Views */}
      {viewMode === "list" && (
        <DataTable
          columns={columns}
          data={filteredTasks || []}
          loading={isLoading}
          actions={false}
          onEdit={(row) => { setEditingTask(row); setIsModalOpen(true); }}
          onDelete={(id) => setDeleteId(id)}
        />
      )}
 
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statuses.map(status => {
            const statusTasks = (filteredTasks || []).filter(t => 
              status === "TODO" 
                ? (t.status === "TODO" || t.status === "PENDING")
                : t.status === status
            );
            return (
              <div 
                key={status} 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const taskId = e.dataTransfer.getData("taskId");
                  if (taskId) handleDragDropStatusChange(taskId, status);
                }}
                className="glass-panel p-4 rounded-3xl flex flex-col min-h-[500px] border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 hover:border-blue-500/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4 border-b border-[var(--border-color)] pb-2">
                  <h3 className="font-bold text-sm tracking-wide text-[var(--text-primary)]">{columnNames[status]}</h3>
                  <span className="text-xs px-2.5 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full font-bold text-[var(--text-secondary)]">{statusTasks.length}</span>
                </div>
                <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[550px] pr-1 scrollbar-thin">
                  {statusTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-[var(--text-secondary)] py-12">
                      Empty column
                    </div>
                  ) : (
                    statusTasks.map(task => (
                      <motion.div
                        whileHover={{ y: -2, scale: 1.02 }}
                        key={task.id}
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData("taskId", task.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onClick={() => setViewItem(task)}
                        className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl space-y-3 group hover:border-blue-500/25 transition-all cursor-grab active:cursor-grabbing relative shadow-sm hover:shadow-md"
                      >
                        <h4 className="font-bold text-xs text-[var(--text-primary)]">{task.title}</h4>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{task.description || "No description provided."}</p>
                        
                        <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] pt-1">
                          <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No limit"}</span>
                          <span className="font-semibold text-blue-600">{task.assigned_to_name || "Unassigned"}</span>
                        </div>
                        
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-[var(--border-color)] mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsModalOpen(true); }}
                            className="px-2.5 py-1 bg-[var(--bg-secondary)] hover:bg-blue-600/10 text-blue-600 border border-[var(--border-color)] hover:border-blue-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(task.id); }}
                            className="px-2.5 py-1 bg-[var(--bg-secondary)] hover:bg-rose-600/10 text-rose-600 border border-[var(--border-color)] hover:border-rose-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
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
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border-color)]">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] rounded-xl text-xs text-[var(--text-primary)] transition-all cursor-pointer">
                <FaChevronLeft />
              </button>
              <button onClick={nextMonth} className="p-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] rounded-xl text-xs text-[var(--text-primary)] transition-all cursor-pointer">
                <FaChevronRight />
              </button>
            </div>
          </div> 
          <div className="overflow-x-auto w-full scrollbar-thin">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>
     
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-28 bg-[var(--bg-primary)]/40 border border-dashed border-[var(--border-color)] rounded-2xl" />;
                  }
                  
                  const dayTasks = (filteredTasks || []).filter(t => {
                    if (!t.due_date) return false;
                    let taskYear = new Date(t.due_date).getFullYear();
                    let taskMonth = new Date(t.due_date).getMonth();
                    let taskDay = new Date(t.due_date).getDate();
                    
                    // Parse standard ISO YYYY-MM-DD safely to prevent timezone shifts
                    if (typeof t.due_date === "string" && /^\d{4}-\d{2}-\d{2}/.test(t.due_date)) {
                      const parts = t.due_date.substring(0, 10).split("-");
                      taskYear = parseInt(parts[0], 10);
                      taskMonth = parseInt(parts[1], 10) - 1;
                      taskDay = parseInt(parts[2], 10);
                    }
                    
                    return taskYear === currentYear && taskMonth === currentMonth && taskDay === day;
                  });
     
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
     
                  return (
                    <div 
                      key={`day-${day}`} 
                      className={`h-28 p-2.5 rounded-2xl flex flex-col justify-between hover:bg-[var(--bg-hover)] hover:border-blue-500/20 transition-all relative ${
                        isToday 
                          ? "bg-blue-500/5 border-2 border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                          : "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-xs font-bold ${isToday ? "text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/10" : "text-[var(--text-secondary)]"}`}>
                          {day}
                        </span>
                        {isToday && (
                          <span className="text-[8px] font-black text-blue-500 uppercase tracking-wider bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10">Today</span>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1 mt-1.5 scrollbar-none w-full">
                        {dayTasks.map(t => (
                          <div
                            key={t.id}
                            onClick={(e) => { e.stopPropagation(); setViewItem(t); }}
                            className="px-2 py-1 text-[9px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg cursor-pointer truncate transition-all hover:bg-blue-600 hover:text-white"
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
