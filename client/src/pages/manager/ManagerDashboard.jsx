import { useQuery } from "@tanstack/react-query";
import { 
  FaTasks, FaProjectDiagram, FaMoneyBill, FaClock, 
  FaUserFriends, FaCheckCircle, FaExclamationTriangle, FaArrowRight 
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Cell, PieChart, Pie 
} from "recharts";
import DashboardCard from "../../components/dashboard/DashboardCard";
import PageLoader from "../../components/loaders/PageLoader";
import { getProjects } from "../../services/projectService";
import { getTasks } from "../../services/taskService";
import { getExpenses } from "../../services/expenseService";
import { useAuth } from "../../context/AuthContext";

function ManagerDashboard() {
  const { user } = useAuth();

  // 1. Fetch Manager's Assigned Projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["managerProjects"],
    queryFn: getProjects,
  });

  // 2. Fetch Tasks inside those projects
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["managerTasks"],
    queryFn: getTasks,
  });

  // 3. Fetch Expenses submitted by team members (pending approval)
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["managerExpenses"],
    queryFn: getExpenses,
  });

  const isLoading = projectsLoading || tasksLoading || expensesLoading;

  if (isLoading) return <PageLoader />;

  // Calculate manager statistics
  const activeProjects = projects.filter(p => p.status === "ACTIVE");
  const completedProjects = projects.filter(p => p.status === "COMPLETED");
  
  const completedTasks = tasks.filter(t => t.status === "COMPLETED");
  const pendingTasks = tasks.filter(t => t.status === "PENDING" || t.status === "IN_PROGRESS" || t.status === "TODO");
  
  // Overdue tasks calculation
  const today = new Date().setHours(0,0,0,0);
  const overdueTasks = tasks.filter(t => {
    return t.status !== "COMPLETED" && new Date(t.due_date).getTime() < today;
  });

  // Expenses pending review
  const pendingExpenses = expenses.filter(e => e.status === "PENDING");
  const totalPendingExpenseValue = pendingExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Group tasks by status for status bar chart
  const taskStatusMap = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const taskChartData = Object.entries(taskStatusMap).map(([status, count]) => ({
    name: status.replace("_", " "),
    count
  }));

  // Project progress percentage (Avg of task completion per project or status ratio)
  const projectChartData = projects.slice(0, 5).map(proj => {
    const projTasks = tasks.filter(t => t.project_id === proj.id);
    const completedProjTasks = projTasks.filter(t => t.status === "COMPLETED");
    const progress = projTasks.length > 0 
      ? Math.round((completedProjTasks.length / projTasks.length) * 100)
      : 0;

    return {
      name: proj.project_name,
      Progress: progress
    };
  });

  // Color mapping for Pie Chart
  const taskColors = ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e"];

  // Animation layout
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      {/* Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
            Manager Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, <span className="text-blue-400 font-semibold">{user?.fullName}</span> • Team Management dashboard.
          </p>
        </div>
        <div className="px-4 py-2 bg-white/5 border border-white/5 text-slate-300 text-xs rounded-2xl">
          Supervising: <span className="text-indigo-400 font-bold">{projects.length} Assigned Projects</span>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Assigned Projects"
          value={projects.length}
          icon={<FaProjectDiagram />}
          description={`Active: ${activeProjects.length} | Completed: ${completedProjects.length}`}
          trend={{ value: "Operational", type: "positive" }}
        />
        <DashboardCard
          title="Team Tasks"
          value={tasks.length}
          icon={<FaTasks />}
          description={`Completed: ${completedTasks.length} | Pending: ${pendingTasks.length}`}
          trend={{ value: `${completedTasks.length} Completed`, type: "positive" }}
        />
        <DashboardCard
          title="Overdue Items"
          value={overdueTasks.length}
          icon={<FaClock />}
          description="Tasks past target deadlines"
          trend={overdueTasks.length > 0 ? { value: `${overdueTasks.length} Critical`, type: "negative" } : { value: "On Track", type: "positive" }}
        />
        <DashboardCard
          title="Pending Approvals"
          value={pendingExpenses.length}
          icon={<FaMoneyBill />}
          description={`Total Sum: ₹${totalPendingExpenseValue.toFixed(2)}`}
          trend={pendingExpenses.length > 0 ? { value: "Review Req.", type: "negative" } : { value: "No Claims", type: "positive" }}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project progress bars */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">Project Completion Rates</h3>
              <p className="text-xs text-slate-400">Percentage of tasks fully closed out per project</p>
            </div>
          </div>
          <div className="h-[280px]">
            {projectChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No active projects or task mappings recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280} minWidth={0}>
                <BarChart data={projectChartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "rgba(15, 23, 42, 0.9)", 
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      color: "#fff"
                    }} 
                  />
                  <Bar dataKey="Progress" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                    {projectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.Progress > 75 ? "#10b981" : entry.Progress > 30 ? "#3b82f6" : "#f59e0b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Task Status Distribution chart */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide mb-1">Task Workflows Allocation</h3>
            <p className="text-xs text-slate-400 mb-6">Status breakdown across team work pipelines</p>
          </div>
          <div className="h-[220px] relative flex items-center justify-center">
            {taskChartData.length === 0 ? (
              <div className="text-slate-500 text-sm">No task status allocation mappings available</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={taskChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {taskChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={taskColors[index % taskColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: "rgba(15, 23, 42, 0.9)", 
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        color: "#fff"
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Completed</span>
                  <span className="text-2xl font-black text-[var(--text-primary)] text-glow">{completedTasks.length}</span>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center mt-4 text-xs">
            {taskChartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: taskColors[idx % taskColors.length] }} />
                <span>{item.name} ({item.count})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Task Overdue Lists & Pending Expense Approvals Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending approvals section */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FaMoneyBill className="text-emerald-400 text-lg" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">Expense Approvals Requested</h3>
            </div>
            <Link to="/manager/expenses" className="text-xs text-blue-400 flex items-center gap-1.5 hover:underline font-semibold">
              <span>View All</span>
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {pendingExpenses.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Excellent! No pending expense claims found for review.
              </div>
            ) : (
              pendingExpenses.map(expense => (
                <div key={expense.id} className="p-3.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--text-primary)]">₹{Number(expense.amount).toFixed(2)}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/20">{expense.category}</span>
                    </div>
                    <p className="text-xs text-slate-400">{expense.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>Submitted by: <strong>{expense.employee_name || "Employee"}</strong></span>
                      <span>•</span>
                      <span>Project: <strong>{expense.project_name || "N/A"}</strong></span>
                    </div>
                  </div>
                  <Link 
                    to="/manager/expenses" 
                    className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600 hover:text-white text-blue-400 transition-all text-xs font-bold"
                  >
                    Review Claim
                  </Link>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Task lists & Upcoming deadlines section */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FaClock className="text-rose-400 text-lg" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">Upcoming Team Deadlines</h3>
            </div>
            <Link to="/manager/tasks" className="text-xs text-blue-400 flex items-center gap-1.5 hover:underline font-semibold">
              <span>Assign Task</span>
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {pendingTasks.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Awesome! No pending tasks in your workflow cycle.
              </div>
            ) : (
              pendingTasks.slice(0, 6).map(task => {
                const isOverdue = new Date(task.due_date).getTime() < today;
                return (
                  <div key={task.id} className="p-3.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all flex justify-between items-center">
                    <div className="space-y-1 flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{task.title}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === "HIGH" 
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                            : task.priority === "MEDIUM" 
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" 
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>{task.priority}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>Assigned to: <strong>{task.assigned_to_name || "Staff"}</strong></span>
                        <span>•</span>
                        <span>Project: <strong>{task.project_name}</strong></span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${
                        isOverdue 
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}>
                        {isOverdue ? "Overdue" : `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ManagerDashboard;