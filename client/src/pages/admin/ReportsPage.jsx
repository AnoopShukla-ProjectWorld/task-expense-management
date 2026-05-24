import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaDownload, FaCalendarAlt, FaFilter, FaTasks, FaMoneyBillWave, 
  FaBriefcase, FaUserCheck, FaSearch, FaFileCsv, FaFileExcel, 
  FaChartLine, FaRobot, FaTimes, FaCheckCircle, FaExclamationTriangle,
  FaLightbulb, FaFilePdf
} from "react-icons/fa";
import toast from "react-hot-toast";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend, PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";
import { 
  getAdminDashboardStats, 
  getTaskAnalytics, 
  getExpenseAnalytics, 
  getUserProductivity, 
  exportCSV, 
  exportExcel 
} from "../../services/reportService";
import PageLoader from "../../components/loaders/PageLoader";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

function ReportsPage() {
  // Date State with realistic 2026 presets
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: getAdminDashboardStats,
  });

  const { data: taskData = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["taskAnalytics", startDate, endDate],
    queryFn: () => getTaskAnalytics({ startDate, endDate }),
  });

  const { data: expenseData = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenseAnalytics", startDate, endDate],
    queryFn: () => getExpenseAnalytics({ startDate, endDate }),
  });

  const { data: productivityData = [], isLoading: productivityLoading } = useQuery({
    queryKey: ["userProductivity"],
    queryFn: getUserProductivity,
  });

  const isLoading = statsLoading || tasksLoading || expensesLoading || productivityLoading;

  // Preset Handlers
  const handlePreset = (preset) => {
    let start = new Date("2026-01-01");
    let end = new Date("2026-12-31");

    if (preset === "month") {
      start = new Date("2026-05-01");
      end = new Date("2026-05-31");
    } else if (preset === "quarter") {
      start = new Date("2026-04-01");
      end = new Date("2026-06-30");
    } else if (preset === "last30") {
      start = new Date("2026-04-22");
      end = new Date("2026-05-22");
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    toast.success(`Filters set for ${preset === "month" ? "May 2026" : preset === "quarter" ? "Q2 2026" : "Last 30 Days"}`);
  };

  // Export handlers
  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      const blob = await exportCSV();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Enterprise_Productivity_Report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV Report downloaded successfully!");
    } catch (err) {
      toast.error("Failed to generate CSV export.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const blob = await exportExcel();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Enterprise_Productivity_Report_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel Sheet downloaded successfully!");
    } catch (err) {
      toast.error("Failed to generate Excel export.");
    } finally {
      setExportLoading(false);
    }
  };

  // Printable client-side PDF Report Exporter
  const handleExportPDF = () => {
    const originalTitle = document.title;
    document.title = `Enterprise_Cockpit_Report_${startDate}_to_${endDate}`;
    
    // Construct HTML printable overlay
    const printableArea = document.createElement("div");
    printableArea.className = "print-only-container";
    printableArea.style.position = "fixed";
    printableArea.style.left = "0";
    printableArea.style.top = "0";
    printableArea.style.width = "100%";
    printableArea.style.height = "100%";
    printableArea.style.zIndex = "999999";
    printableArea.style.backgroundColor = "#ffffff";
    printableArea.style.color = "#0f172a";
    printableArea.style.padding = "40px";
    printableArea.style.fontFamily = "system-ui, -apple-system, sans-serif";
    printableArea.style.overflowY = "auto";

    let rowsHTML = "";
    filteredProductivity.forEach((item, index) => {
      const ratio = item.total_tasks > 0 ? Math.round((item.completed_tasks / item.total_tasks) * 100) : 0;
      rowsHTML += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-weight: 600;">${item.full_name}</td>
          <td style="padding: 12px; text-align: center;">${item.total_tasks}</td>
          <td style="padding: 12px; text-align: center; color: #10b981; font-weight: 700;">${item.completed_tasks}</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">${ratio}%</td>
        </tr>
      `;
    });

    printableArea.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #0f172a;">Task & Expense Management</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Enterprise Performance & Financial Audit</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #3b82f6;">CONFIDENTIAL</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Date Range: ${startDate} to ${endDate}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b;">Total Tracked Outflow</p>
            <p style="margin: 8px 0 0 0; font-size: 22px; font-weight: bold; color: #0f172a;">₹${stats?.total_expenses ?? 0}</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #ef4444;">Pending: ₹${stats?.pending_expenses ?? 0}</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b;">Active Projects Fleet</p>
            <p style="margin: 8px 0 0 0; font-size: 22px; font-weight: bold; color: #0f172a;">${stats?.active_projects ?? 0}</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #ef4444;">Overdue Deadlines: ${stats?.overdue_projects ?? 0}</p>
          </div>
        </div>

        <div style="margin-bottom: 40px;">
          <h3 style="margin-bottom: 12px; font-size: 16px; color: #0f172a;">Workforce Productivity Ledger</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-weight: bold; color: #334155;">
                <th style="padding: 12px;">Staff Member</th>
                <th style="padding: 12px; text-align: center;">Allocated Tasks</th>
                <th style="padding: 12px; text-align: center;">Completed Work</th>
                <th style="padding: 12px; text-align: right;">Completion Ratio</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #64748b;">No fleet logs found</td></tr>'}
            </tbody>
          </table>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px;">
          Report generated automatically on ${new Date().toLocaleString("en-IN")} by Enterprise Intelligence system.
        </div>
      </div>
    `;

    document.body.appendChild(printableArea);
    
    // Temporarily hide main workspace for printing
    const rootEl = document.getElementById("root");
    if (rootEl) rootEl.style.display = "none";

    setTimeout(() => {
      window.print();
      if (rootEl) rootEl.style.display = "block";
      printableArea.remove();
      document.title = originalTitle;
      toast.success("PDF exported successfully!");
    }, 150);
  };

  // Heuristic AI Insight generator logic
  const handleTriggerAiAudit = () => {
    setIsAiOpen(true);
    setAiAnalyzing(true);
    setAiInsights(null);

    // Simulate elite AI compute with real metrics analysis
    setTimeout(() => {
      const anomalies = [];
      const suggestions = [];
      const statistics = {
        velocity: 0,
        bottlenecks: 0,
        budgetOverrun: 0
      };

      // 1. Analyze expense thresholds and budgets
      const pendingExpensesTotal = stats?.pending_expenses || 0;
      if (pendingExpensesTotal > 20000) {
        anomalies.push({
          type: "WARNING",
          title: "High Pending Claims Backlog",
          desc: `There is a backlog of ₹${pendingExpensesTotal} in pending expense approvals. This could impact cashflow estimates and project budget reconciliation.`
        });
      }

      // 2. Identify resource bottlenecks
      productivityData.forEach(user => {
        if (user.total_tasks - user.completed_tasks > 3) {
          statistics.bottlenecks++;
          anomalies.push({
            type: "DANGER",
            title: `Operational Bottleneck: ${user.full_name}`,
            desc: `${user.full_name} has ${user.total_tasks - user.completed_tasks} active unresolved tasks. Consider redistributing workflow assignments.`
          });
        }
      });

      // 3. Rate velocity
      const taskCompletionRate = stats?.total_tasks ? (stats.completed_tasks / stats.total_tasks) : 0;
      statistics.velocity = Math.round(taskCompletionRate * 100);

      if (statistics.velocity >= 75) {
        suggestions.push({
          title: "Optimal Workforce Velocity",
          desc: "Task resolution is highly efficient (above 75%). Continue current team project alignment paradigms."
        });
      } else {
        suggestions.push({
          title: "Suboptimal Completion Ratios",
          desc: "The current resolution velocity is standing at lower than 75%. We advise slicing bigger tasks into micro-steps or running progress check-ins."
        });
      }

      // Add general budgeting rule suggestion
      suggestions.push({
        title: "Rupee Allocation Strategy",
        desc: "Ensure expense submissions map properly to pre-assigned project cost keys before granting approval to avoid budget spills."
      });

      setAiInsights({
        anomalies,
        suggestions,
        statistics
      });
      setAiAnalyzing(false);
      toast.success("AI Heuristic audit completed!");
    }, 1200);
  };

  // Filter local users by search query
  const filteredProductivity = productivityData.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Map Task Pie Chart
  const taskChartData = taskData.map(item => ({
    name: item.status,
    value: Number(item.total) || 0
  }));

  // Map Expense Bar Chart
  const expenseChartData = expenseData.map(item => ({
    category: item.category,
    amount: Number(item.total_amount) || 0
  }));

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  if (isLoading) return <PageLoader />;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-slate-400 flex items-center gap-3">
            <FaChartLine className="text-blue-500" />
            Intelligence Cockpit
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Aggregate high-fidelity analytics, analyze productivity metrics, and run financial exports.
          </p>
        </div>

        {/* Action Center Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleTriggerAiAudit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all duration-300 shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95"
          >
            <FaRobot className="text-white text-base animate-pulse" />
            Run AI Audit
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 font-semibold text-sm transition-all duration-300 shadow-md cursor-pointer active:scale-95"
          >
            <FaFilePdf className="text-rose-400 text-base" />
            Print PDF
          </button>
          <button
            disabled={exportLoading}
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[var(--text-primary)] font-medium text-sm transition-all duration-300 shadow-lg cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <FaFileCsv className="text-blue-400 text-lg" />
            Export CSV
          </button>
          <button
            disabled={exportLoading}
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 font-medium text-sm transition-all duration-300 shadow-lg cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <FaFileExcel className="text-emerald-400 text-lg" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Control Filter Bar - Glassmorphism */}
      <motion.div 
        variants={itemVariants} 
        className="glass-panel p-6 rounded-2xl flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
          <span className="text-[var(--text-secondary)] text-sm font-semibold flex items-center gap-2">
            <FaFilter className="text-blue-500" /> Filter Spectrum:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePreset("last30")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                startDate === "2026-04-22" && endDate === "2026-05-22"
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                  : "bg-white/5 text-[var(--text-secondary)] border-white/5 hover:bg-white/10"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePreset("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                startDate === "2026-05-01" && endDate === "2026-05-31"
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                  : "bg-white/5 text-[var(--text-secondary)] border-white/5 hover:bg-white/10"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePreset("quarter")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                startDate === "2026-04-01" && endDate === "2026-06-30"
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                  : "bg-white/5 text-[var(--text-secondary)] border-white/5 hover:bg-white/10"
              }`}
            >
              This Quarter (Q2)
            </button>
            <button
              onClick={() => {
                setStartDate("2026-01-01");
                setEndDate("2026-12-31");
                toast.success("Filters set for all of 2026");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                startDate === "2026-01-01" && endDate === "2026-12-31"
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                  : "bg-white/5 text-[var(--text-secondary)] border-white/5 hover:bg-white/10"
              }`}
            >
              Full Year 2026
            </button>
          </div>
        </div>

        {/* Date Picking Form Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-[var(--text-secondary)] font-medium">From:</span>
            <div className="relative w-full sm:w-auto">
              <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-44 pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] text-xs font-medium focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-[var(--text-secondary)] font-medium">To:</span>
            <div className="relative w-full sm:w-auto">
              <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-44 pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] text-xs font-medium focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all duration-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Outflow (Expenses)</span>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FaMoneyBillWave />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">₹{stats?.total_expenses ?? 0}</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Pending Approval: <strong className="text-yellow-400">₹{stats?.pending_expenses ?? 0}</strong>
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all duration-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Active Projects</span>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <FaBriefcase />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{stats?.active_projects ?? 0}</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Overdue Deadlines: <strong className="text-rose-400">{stats?.overdue_projects ?? 0}</strong>
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all duration-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Tasks Resolution</span>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FaTasks />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {stats?.completed_tasks ?? 0} / {stats?.total_tasks ?? 0}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Completion Rate: <strong className="text-blue-400">{stats?.total_tasks ? ((stats.completed_tasks / stats.total_tasks) * 100).toFixed(0) : 0}%</strong>
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all duration-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Staff Fleet</span>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FaUserCheck />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{stats?.total_users ?? 0}</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Active Force: <strong className="text-emerald-400">{stats?.active_users ?? 0} Members</strong>
          </p>
        </div>
      </motion.div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Category Breakdown Chart */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">Category Expense Trends</h3>
                <p className="text-xs text-[var(--text-secondary)]">Summed outflow segmented across departments and bounds</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] uppercase font-bold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Financials
              </span>
            </div>
            <div className="h-[300px]">
              {expenseChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm border border-dashed border-white/5 rounded-xl">
                  No expense records found inside the defined range.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300} minWidth={0}>
                  <BarChart data={expenseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="neonEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-secondary)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        color: "var(--text-primary)"
                      }}
                    />
                    <Bar dataKey="amount" fill="url(#neonEmeraldGrad)" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </motion.div>

        {/* Task Allocation Chart */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">Tasks Status Ratio</h3>
                <p className="text-xs text-[var(--text-secondary)]">Distribution analysis of tasks created inside bounds</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] uppercase font-bold rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                Workflows
              </span>
            </div>
            <div className="h-[300px] flex items-center justify-center">
              {taskChartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm border border-dashed border-white/5 rounded-xl">
                  No task metrics available for selected dates.
                </div>
              ) : (
                <div className="w-full h-full flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-full sm:w-1/2 h-[220px]">
                    <ResponsiveContainer width="100%" height={220} minWidth={0}>
                      <PieChart>
                        <Pie
                          data={taskChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {taskChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-secondary)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "12px",
                            color: "var(--text-primary)"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-3 w-full sm:w-1/2">
                    {taskChartData.map((item, idx) => (
                      <div key={item.name} className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-xs text-[var(--text-secondary)] font-medium">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-[var(--text-primary)]">{item.value} Tasks</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* User Productivity Ranking Ledger */}
      <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">Workforce Productivity Ledger</h3>
            <p className="text-xs text-[var(--text-secondary)]">Comprehensive audit tracking of tasks processed by employee</p>
          </div>
          
          {/* Inner Search Box */}
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search employee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all duration-300"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[var(--text-secondary)] font-semibold">
                <th className="pb-3 pl-4">Staff Member</th>
                <th className="pb-3 text-center">Allocated Tasks</th>
                <th className="pb-3 text-center">Completed Work</th>
                <th className="pb-3 pr-4">Completion Ratio</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredProductivity.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                      No matching records found in the productivity fleet.
                    </td>
                  </tr>
                ) : (
                  filteredProductivity.map((item, index) => {
                    const ratio = item.total_tasks > 0 
                      ? Math.round((item.completed_tasks / item.total_tasks) * 100) 
                      : 0;
                    return (
                      <motion.tr 
                        key={item.id || index}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-white/5 hover:bg-white/2 transition-colors group"
                      >
                        <td className="py-4 pl-4 font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors duration-200">
                          {item.full_name}
                        </td>
                        <td className="py-4 text-center font-semibold text-[var(--text-secondary)]">
                          {item.total_tasks}
                        </td>
                        <td className="py-4 text-center font-bold text-emerald-400">
                          {item.completed_tasks}
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-[var(--text-secondary)] w-8">{ratio}%</span>
                            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${ratio}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full rounded-full bg-gradient-to-r ${
                                  ratio >= 75 
                                    ? "from-emerald-500 to-teal-400" 
                                    : ratio >= 40 
                                      ? "from-blue-500 to-indigo-400" 
                                      : "from-amber-500 to-orange-400"
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* AI Auditing sliding drawer */}
      <AnimatePresence>
        {isAiOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiOpen(false)}
              className="fixed inset-0 bg-black z-[100] cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-[var(--bg-secondary)] border-l border-white/10 z-[101] shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <FaRobot className="text-xl animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-[var(--text-primary)]">Heuristic AI Insights</h3>
                      <p className="text-[var(--text-secondary)] text-xs">Real-time system health audit report</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAiOpen(false)}
                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-[var(--text-primary)] transition-all cursor-pointer"
                  >
                    <FaTimes />
                  </button>
                </div>

                {aiAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
                    <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider animate-pulse">
                      Analyzing operational datasets...
                    </p>
                  </div>
                ) : (
                  aiInsights && (
                    <div className="space-y-6">
                      {/* Metric Grid inside drawer */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                          <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Work Completion Velocity</p>
                          <p className="text-2xl font-black text-indigo-400 mt-1">{aiInsights.statistics.velocity}%</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                          <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Staff Bottlenecks</p>
                          <p className="text-2xl font-black text-rose-400 mt-1">{aiInsights.statistics.bottlenecks}</p>
                        </div>
                      </div>

                      {/* Anomaly Alerts list */}
                      <div className="space-y-3.5">
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Anomalies Detected</h4>
                        {aiInsights.anomalies.length === 0 ? (
                          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                            <FaCheckCircle className="text-emerald-400 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-emerald-400">Zero Anomalies Located</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Budget balances and workforce loads are completely within safe parameters.</p>
                            </div>
                          </div>
                        ) : (
                          aiInsights.anomalies.map((anom, idx) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border flex items-start gap-3 ${
                                anom.type === "DANGER" 
                                  ? "bg-rose-500/5 border-rose-500/10 text-rose-400" 
                                  : "bg-amber-500/5 border-amber-500/10 text-amber-400"
                              }`}
                            >
                              <FaExclamationTriangle className="mt-0.5 text-sm" />
                              <div>
                                <p className="text-xs font-bold">{anom.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{anom.desc}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* AI Suggestions recommendations list */}
                      <div className="space-y-3.5">
                        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">AI Operations Blueprint</h4>
                        <div className="space-y-3">
                          {aiInsights.suggestions.map((sug, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
                              <FaLightbulb className="text-indigo-400 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-indigo-400">{sug.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{sug.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="border-t border-white/5 pt-4 mt-6">
                <button
                  onClick={() => setIsAiOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-primary)] font-bold text-xs transition-all cursor-pointer text-center"
                >
                  Dismiss Drawer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ReportsPage;