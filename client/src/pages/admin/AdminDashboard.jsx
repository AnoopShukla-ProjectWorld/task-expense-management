import { useQuery } from "@tanstack/react-query";
import { 
  FaUsers, FaTasks, FaMoneyBill, FaProjectDiagram, 
  FaUserShield, FaClock, FaCheckCircle, FaExclamationCircle, 
  FaBan, FaHistory, FaNetworkWired, FaCircle
} from "react-icons/fa";
import { motion } from "framer-motion";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, PieChart, Pie, Cell 
} from "recharts";
import DashboardCard from "../../components/dashboard/DashboardCard";
import PageLoader from "../../components/loaders/PageLoader";
import { getAdminDashboardStats, getAuditLogs, getExpenseAnalytics, getUserProductivity } from "../../services/reportService";
import { useAuth } from "../../context/AuthContext";

function AdminDashboard() {
  const { user } = useAuth();

  // Fetch Core Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: getAdminDashboardStats,
  });

  // Fetch Audit Logs for activity list
  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: getAuditLogs,
  });

  // Fetch Expense data for chart
  const { data: expenseStats = [] } = useQuery({
    queryKey: ["adminExpenseAnalytics"],
    queryFn: () => getExpenseAnalytics({ startDate: "2026-01-01", endDate: "2026-12-31" }),
  });

  // Fetch Productivity ranking for charts/tables
  const { data: productivityStats = [] } = useQuery({
    queryKey: ["adminProductivity"],
    queryFn: getUserProductivity,
  });

  const isLoading = statsLoading || auditLoading;

  if (isLoading) return <PageLoader />;

  // Chart Data formatters
  const expenseChartData = expenseStats.map(item => ({
    name: item.category,
    amount: Number(item.total_amount) || 0
  }));

  const projectStatusData = [
    { name: "Active Projects", value: stats?.active_projects ?? 0, color: "#3b82f6" },
    { name: "Overdue Projects", value: stats?.overdue_projects ?? 0, color: "#f43f5e" },
    { name: "Completed Tasks", value: stats?.completed_tasks ?? 0, color: "#10b981" },
    { name: "Pending Tasks", value: stats?.pending_tasks ?? 0, color: "#eab308" }
  ].filter(item => item.value > 0);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
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
      {/* Dynamic Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Admin Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, <span className="text-blue-400 font-semibold">{user?.fullName}</span> • Full System Visibility Authorized.
          </p>
        </div>
        <div className="flex gap-3 text-xs bg-white/5 border border-white/5 rounded-2xl px-4 py-2 text-slate-400 items-center">
          <FaCircle className="text-emerald-500 animate-pulse" />
          <span>Active Sessions: <strong>{stats?.active_sessions ?? 1}</strong></span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Users Fleet"
          value={stats?.total_users ?? 0}
          icon={<FaUsers />}
          description={`Active: ${stats?.active_users ?? 0} | Managers: ${stats?.managers_count ?? 0}`}
          trend={{ value: `${stats?.employees_count ?? 0} Staff`, type: "positive" }}
        />
        <DashboardCard
          title="Active Projects"
          value={stats?.active_projects ?? 0}
          icon={<FaProjectDiagram />}
          description={`Overdue Projects: ${stats?.overdue_projects ?? 0}`}
          trend={stats?.overdue_projects > 0 ? { value: `${stats.overdue_projects} Critical`, type: "negative" } : { value: "All Normal", type: "positive" }}
        />
        <DashboardCard
          title="Enterprise Tasks"
          value={stats?.total_tasks ?? 0}
          icon={<FaTasks />}
          description={`Completed: ${stats?.completed_tasks ?? 0} | Pending: ${stats?.pending_tasks ?? 0}`}
          trend={{ value: `${((stats?.completed_tasks / (stats?.total_tasks || 1)) * 100).toFixed(0)}% Done`, type: "positive" }}
        />
        <DashboardCard
          title="Expenses Log"
          value={`₹${stats?.total_expenses ?? 0}`}
          icon={<FaMoneyBill />}
          description={`Pending Reviews: ${stats?.pending_expenses ?? 0}`}
          trend={stats?.pending_expenses > 0 ? { value: `${stats.pending_expenses} Pending`, type: "negative" } : { value: "Cleared", type: "positive" }}
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense breakdown - Glass card */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Expense Outflows by Category</h3>
              <p className="text-xs text-slate-400">Aggregated dynamic metrics for the active fiscal cycle</p>
            </div>
            <div className="px-3 py-1 text-xs rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-semibold">
              Live Chart
            </div>
          </div>
          <div className="h-[300px]">
            {expenseChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No expense analytics data available currently.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={expenseChartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "rgba(15, 23, 42, 0.9)", 
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      color: "#fff"
                    }} 
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Project Metrics Summary Card */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide mb-1">Status Allocation</h3>
            <p className="text-xs text-slate-400 mb-6">Distribution profiles of workflows and projects</p>
          </div>
          <div className="h-[200px] relative flex items-center justify-center">
            {projectStatusData.length === 0 ? (
              <div className="text-slate-500 text-sm">No status allocations</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Completes</span>
                  <span className="text-2xl font-black text-white text-glow">{stats?.completed_tasks ?? 0}</span>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
            {projectStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid: Audit Activity Logs & User Productivity Rankings */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Audit Logs */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2.5">
              <FaHistory className="text-blue-400 text-lg" />
              <h3 className="text-lg font-bold text-white tracking-wide">Enterprise Audit Feed</h3>
            </div>
            <span className="text-[10px] text-slate-400 tracking-widest uppercase">System Activity</span>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No system activity or audit records found.
              </div>
            ) : (
              auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
                  <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs">
                    <FaNetworkWired />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-white truncate">{log.action}</p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{log.details}</p>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500">
                      <span>IP: {log.ip_address || "Internal"}</span>
                      <span>User ID: {log.user_id}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Productivity rankings */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2.5">
              <FaUserShield className="text-indigo-400 text-lg" />
              <h3 className="text-lg font-bold text-white tracking-wide">Staff Productivity Matrix</h3>
            </div>
            <span className="text-[10px] text-slate-400 tracking-widest uppercase">Performance Index</span>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
            {productivityStats.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No user statistics found in active workspaces.
              </div>
            ) : (
              productivityStats.map((item, idx) => {
                const percent = item.total_tasks > 0 
                  ? ((item.completed_tasks / item.total_tasks) * 100).toFixed(0) 
                  : 0;

                return (
                  <div key={item.id} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase">
                          {item.full_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.full_name}</h4>
                          <p className="text-[10px] text-slate-500">Rank #{idx + 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-white text-glow">{percent}%</span>
                        <p className="text-[10px] text-slate-500">Efficiency</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar container */}
                    <div className="space-y-1.5">
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Tasks Completed: <strong>{item.completed_tasks}</strong></span>
                        <span>Total Assigned: <strong>{item.total_tasks}</strong></span>
                      </div>
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

export default AdminDashboard;