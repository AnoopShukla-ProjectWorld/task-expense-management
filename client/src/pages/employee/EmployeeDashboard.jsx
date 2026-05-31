import { useQuery } from "@tanstack/react-query";
import { 
  FaTasks, FaProjectDiagram, FaMoneyBill, FaClock, 
  FaCheckCircle, FaExclamationTriangle, FaArrowRight, FaCalendarAlt 
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, Cell, PieChart, Pie 
} from "recharts";
import DashboardCard from "../../components/dashboard/DashboardCard";
import PageLoader from "../../components/loaders/PageLoader";
import { getTasks } from "../../services/taskService";
import { getExpenses } from "../../services/expenseService";
import { useAuth } from "../../context/AuthContext";

function EmployeeDashboard() {
  const { user } = useAuth();

  // 1. Fetch Employee's Assigned Tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["employeeTasks"],
    queryFn: getTasks,
  });

  // 2. Fetch Employee's Submitted Expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["employeeExpenses"],
    queryFn: () => getExpenses({ my: true }),
  });

  const isLoading = tasksLoading || expensesLoading;

  if (isLoading) return <PageLoader />;

  // Metrics calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const pendingTasks = tasks.filter(t => t.status === "PENDING" || t.status === "TODO").length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Overdue calculation
  const today = new Date().setHours(0,0,0,0);
  const overdueTasks = tasks.filter(t => {
    return t.status !== "COMPLETED" && new Date(t.due_date).getTime() < today;
  });

  // Financial claims
  const approvedExpenses = expenses.filter(e => e.status === "APPROVED");
  const pendingExpenses = expenses.filter(e => e.status === "PENDING");
  const rejectedExpenses = expenses.filter(e => e.status === "REJECTED");

  const approvedSum = approvedExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const pendingSum = pendingExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Task list filtering for display (pending tasks order by due date)
  const pendingTasksList = tasks
    .filter(t => t.status !== "COMPLETED")
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  // Chart data: Task categories pie data
  const taskChartData = [
    { name: "Completed", value: completedTasks, color: "#10b981" },
    { name: "In Progress", value: inProgressTasks, color: "#3b82f6" },
    { name: "Pending / TODO", value: pendingTasks, color: "#eab308" }
  ].filter(item => item.value > 0);

  // Chart data: Monthly expenses claim amounts
  const expenseChartData = expenses.slice(0, 8).map(exp => ({
    name: new Date(exp.expense_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    Claim: Number(exp.amount)
  })).reverse();

  // Animation variants
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
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
            Welcome back, {user?.fullName.split(" ")[0]}
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Let's review your assignments and track pending expenses.
          </p>
        </div>
        <div className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 text-xs rounded-2xl flex items-center gap-2">
          <FaCalendarAlt className="text-blue-400" />
          <span>Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Cards Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="My Assignments"
          value={totalTasks}
          icon={<FaTasks />}
          description={`Progress: ${inProgressTasks} Active | ${pendingTasks} Pending`}
          trend={{ value: `${completionRate}% Closed`, type: "positive" }}
        />
        <DashboardCard
          title="Overdue Reminders"
          value={overdueTasks.length}
          icon={<FaClock />}
          description="Critical assignments pending"
          trend={overdueTasks.length > 0 ? { value: `${overdueTasks.length} Warning`, type: "negative" } : { value: "All Clear", type: "positive" }}
        />
        <DashboardCard
          title="Approved Expenses"
          value={`₹${approvedSum.toFixed(2)}`}
          icon={<FaMoneyBill />}
          description={`Pending Claims: ₹${pendingSum.toFixed(2)}`}
          trend={{ value: `${expenses.length} claims`, type: "positive" }}
        />
      </div>

      {/* Main Charts & Analytics rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses Trends */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">My Recent Claims Trend</h3>
              <p className="text-xs text-slate-500">Visualization of your recent submitted expense claims</p>
            </div>
            <Link to="/employee/tasks" className="text-xs text-blue-400 font-bold hover:underline">
              File Claim from Tasks
            </Link>
          </div>
          <div className="h-[280px]">
            {expenseChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                No expense submissions recorded. Start uploading receipts.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={280} minWidth={0}>
                <AreaChart data={expenseChartData}>
                  <defs>
                    <linearGradient id="colorClaim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--bg-secondary)", 
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      color: "var(--text-primary)"
                    }} 
                  />
                  <Area type="monotone" dataKey="Claim" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClaim)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Task Pie Allocation Card */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide mb-1">Workflow Status</h3>
            <p className="text-xs text-slate-500 mb-6">Distribution ratios of your assigned tasks</p>
          </div>
          <div className="h-[180px] relative flex items-center justify-center">
            {taskChartData.length === 0 ? (
              <div className="text-slate-600 text-sm text-center">No active tasks in portfolio</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%" minHeight={180} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={taskChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {taskChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: "var(--bg-secondary)", 
                        border: "1px solid var(--border-color)",
                        borderRadius: "12px",
                        color: "var(--text-primary)"
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Completed</span>
                  <span className="text-2xl font-black text-[var(--text-primary)] text-glow">{completedTasks}</span>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1 mt-4 text-[10px] text-center">
            {taskChartData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center p-1 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-bold truncate max-w-[70px]">{item.name}</span>
                <span className="text-[var(--text-primary)] font-extrabold">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tasks Queue and Claims Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending Task Queue */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FaTasks className="text-blue-400 text-lg" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">My Active Task Queue</h3>
            </div>
            <Link to="/employee/tasks" className="text-xs text-blue-400 flex items-center gap-1.5 hover:underline font-semibold">
              <span>View Board</span>
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {pendingTasksList.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-600">
                Congratulations! You've cleared all assigned tasks.
              </div>
            ) : (
              pendingTasksList.map(task => {
                const isOverdue = new Date(task.due_date).getTime() < today;
                return (
                  <div key={task.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all flex justify-between items-center">
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
                      <p className="text-xs text-slate-500 truncate">{task.description || "No description provided."}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-600">
                        <span>Project: <strong>{task.project_name}</strong></span>
                        <span>•</span>
                        <span>Status: <strong>{task.status.replace("_", " ")}</strong></span>
                      </div>
                    </div>
                    
                    <div className="text-right whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                        isOverdue 
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                          : "bg-slate-100 text-slate-600 border border-slate-300"
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

        {/* Expenses and Approval Log */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FaMoneyBill className="text-emerald-400 text-lg" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">My Expense Claims Tracker</h3>
            </div>
            <Link to="/employee/expenses" className="text-xs text-blue-400 flex items-center gap-1.5 hover:underline font-semibold">
              <span>View Claims</span>
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {expenses.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-600">
                You haven't submitted any reimbursement claims yet.
              </div>
            ) : (
              expenses.map(expense => (
                <div key={expense.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--text-primary)]">₹{Number(expense.amount).toFixed(2)}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/20">{expense.category}</span>
                    </div>
                    <p className="text-xs text-slate-500">{expense.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-600">
                      <span>Submitted on: {new Date(expense.expense_date).toLocaleDateString()}</span>
                      {expense.rejection_reason && (
                        <>
                          <span>•</span>
                          <span className="text-rose-400 truncate max-w-[150px]">Reason: {expense.rejection_reason}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                      expense.status === "APPROVED" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : expense.status === "REJECTED" 
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>{expense.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default EmployeeDashboard;