import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaHistory, FaSearch, FaUser, FaLaptop, FaChevronDown, FaChevronUp, 
  FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaFilter,
  FaCalendarAlt, FaDatabase
} from "react-icons/fa";
import { getAuditLogs } from "../../services/reportService";
import PageLoader from "../../components/loaders/PageLoader";

// Color helper mapping for actions
const getActionMeta = (action) => {
  const normalized = action?.toUpperCase() || "";
  
  if (normalized.includes("CREATE") || normalized.includes("SUBMIT") || normalized.includes("ADD")) {
    return {
      color: "from-emerald-500 to-green-600 shadow-emerald-500/20 text-emerald-100",
      bgClass: "bg-emerald-500/10 border-emerald-500/20",
      badgeClass: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
      icon: FaPlus
    };
  }
  if (normalized.includes("UPDATE") || normalized.includes("EDIT")) {
    return {
      color: "from-blue-500 to-indigo-600 shadow-blue-500/20 text-blue-100",
      bgClass: "bg-blue-500/10 border-blue-500/20",
      badgeClass: "bg-blue-400/10 text-blue-400 border-blue-400/20",
      icon: FaEdit
    };
  }
  if (normalized.includes("DELETE") || normalized.includes("REMOVE")) {
    return {
      color: "from-rose-500 to-red-600 shadow-rose-500/20 text-rose-100",
      bgClass: "bg-rose-500/10 border-rose-500/20",
      badgeClass: "bg-rose-400/10 text-rose-400 border-rose-400/20",
      icon: FaTrash
    };
  }
  if (normalized.includes("APPROVE")) {
    return {
      color: "from-teal-500 to-emerald-600 shadow-teal-500/20 text-teal-100",
      bgClass: "bg-teal-500/10 border-teal-500/20",
      badgeClass: "bg-teal-400/10 text-teal-400 border-teal-400/20",
      icon: FaCheckCircle
    };
  }
  if (normalized.includes("REJECT")) {
    return {
      color: "from-amber-500 to-rose-600 shadow-amber-500/20 text-amber-100",
      bgClass: "bg-rose-500/10 border-rose-500/20",
      badgeClass: "bg-rose-400/10 text-rose-400 border-rose-400/20",
      icon: FaTimesCircle
    };
  }
  
  return {
    color: "from-slate-500 to-slate-600 shadow-slate-500/20 text-slate-100",
    bgClass: "bg-slate-500/10 border-slate-500/20",
    badgeClass: "bg-slate-400/10 text-slate-400 border-slate-400/20",
    icon: FaHistory
  };
};

// Formats timestamp nicely
const formatTimestamp = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

function AuditLogsPage() {
  const [searchVal, setSearchVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [expandedLog, setExpandedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Fetch audit logs via React Query - optimized backend filtering
  const { data: logs, isLoading } = useQuery({
    queryKey: ["auditLogs", searchQuery],
    queryFn: () => getAuditLogs({ limit: 1000, search: searchQuery }),
  });

  // Reset pagination to Page 1 when filters are changed
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, entityFilter]);

  if (isLoading) return <PageLoader />;

  // Filter logs by entity type selection
  const filteredLogs = (logs || []).filter((log) => {
    return entityFilter === "ALL" || log.entity_name === entityFilter;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Extract list of unique entity names for the selector dropdown
  const uniqueEntities = ["ALL", ...new Set((logs || []).map((l) => l.entity_name).filter(Boolean))];

  const handleToggleExpand = (id) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  // Helper to parse values safely for diff drawer
  const renderValues = (title, val) => {
    if (!val) return <span className="text-slate-500 italic text-xs">None</span>;
    try {
      const parsed = typeof val === "string" ? JSON.parse(val) : val;
      return (
        <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-color)] space-y-2 overflow-auto max-h-60 custom-scrollbar font-mono text-xs">
          {Object.entries(parsed).map(([k, v]) => (
            <div key={k} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-color)] pb-1 gap-1">
              <span className="text-slate-400 font-medium break-all">{k}:</span>
              <span className="text-[var(--text-primary)] font-semibold break-all text-right">
                {v === null ? "null" : typeof v === "object" ? JSON.stringify(v) : String(v)}
              </span>
            </div>
          ))}
        </div>
      );
    } catch {
      return (
        <pre className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-primary)] overflow-auto font-mono max-h-60 custom-scrollbar">
          {String(val)}
        </pre>
      );
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-slate-400 flex items-center gap-3">
            <FaDatabase className="text-indigo-500" />
            System Audit Timeline
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Chronological log of system-wide changes, entity management, and security audit records.
          </p>
        </div>
      </div>

      {/* Dynamic Search & Entity filter bar */}
      <motion.div 
        variants={itemVariants}
        className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center"
      >
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            setSearchQuery(searchVal);
          }}
          className="flex items-center gap-2.5 w-full md:w-[420px]"
        >
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--text-secondary)] pointer-events-none">
              <FaSearch className="text-sm" />
            </span>
            <input
              type="text"
              placeholder="Search action, user, entity, IP..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              autoComplete="off"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-400 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-indigo-500/50 transition-all duration-300"
            />
          </div>
          <button
            type="submit"
            className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm transition-all duration-300 shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95 flex items-center gap-2"
          >
            <FaSearch className="text-xs" />
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
            <FaFilter className="text-indigo-500" /> Entity:
          </span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-all duration-300 cursor-pointer"
          >
            {uniqueEntities.map((ent) => (
              <option key={ent} value={ent} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                {ent}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Main Timeline Section */}
      <motion.div variants={itemVariants} className="relative pl-6 md:pl-10 space-y-6">
        {/* Glowing vertical line */}
        <div className="absolute left-2.5 md:left-4.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-500/40 via-blue-500/30 to-emerald-500/40 blur-[0.5px]" />

        <AnimatePresence mode="popLayout">
          {filteredLogs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-12 text-center rounded-2xl flex flex-col items-center justify-center border border-[var(--border-color)]"
            >
              <div className="p-4 rounded-full bg-[var(--bg-tertiary)] text-slate-400 mb-4">
                <FaHistory className="text-4xl" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">No Audit Trails Located</h3>
              <p className="text-[var(--text-secondary)] text-sm max-w-sm mt-1 mx-auto">
                No system action logs matched your filter constraints or search criteria.
              </p>
            </motion.div>
          ) : (
            paginatedLogs.map((log) => {
              const meta = getActionMeta(log.action);
              const ActionIcon = meta.icon;
              const isExpanded = expandedLog === log.id;

              return (
                <motion.div
                  layoutId={`log-card-${log.id}`}
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  className="relative"
                >
                  {/* Outer glowing action indicator node */}
                  <div className={`absolute -left-9 md:-left-13.5 top-3.5 w-6.5 h-6.5 md:w-8 md:h-8 rounded-full bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-lg border-2 border-[var(--bg-secondary)] z-10`}>
                    <ActionIcon className="text-[10px] md:text-xs text-white" />
                  </div>

                  {/* Audit Card Glass Wrapper */}
                  <div className="glass-panel hover:bg-[var(--bg-hover)] p-5 rounded-2xl border border-[var(--border-color)] transition-all duration-300 shadow-md">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      {/* Left: Text Descriptor */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[var(--text-primary)] hover:underline flex items-center gap-1">
                            <FaUser className="text-xs text-slate-400" />
                            {log.full_name || "System Automated"}
                          </span>
                          <span className="text-slate-500 text-xs">triggered</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {log.action}
                          </span>
                          <span className="text-slate-500 text-xs">on</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${meta.badgeClass}`}>
                            {log.entity_name} {log.entity_id ? `#${log.entity_id}` : ""}
                          </span>
                        </div>

                        {/* Metas and IP values */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1 font-medium">
                            <FaCalendarAlt className="text-slate-500" />
                            {formatTimestamp(log.created_at)}
                          </span>
                          {log.ip_address && (
                            <span className="flex items-center gap-1 font-mono">
                              <FaLaptop className="text-slate-500" />
                              IP: {log.ip_address}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Expandable control action */}
                      {(log.old_values || log.new_values) && (
                        <button
                          onClick={() => handleToggleExpand(log.id)}
                          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap self-end lg:self-center"
                        >
                          {isExpanded ? (
                            <>
                              Collapse Records <FaChevronUp className="text-xs text-slate-400" />
                            </>
                          ) : (
                            <>
                              Inspect Changes <FaChevronDown className="text-xs text-slate-400 animate-bounce" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Collapsible details diff drawer */}
                    <AnimatePresence>
                      {isExpanded && (log.old_values || log.new_values) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 120, damping: 15 }}
                          className="overflow-hidden mt-4 pt-4 border-t border-[var(--border-color)]"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Old State Values */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-rose-400/90 uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Original State (Before)
                              </h4>
                              {renderValues("Original", log.old_values)}
                            </div>

                            {/* New State Values */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-emerald-400/90 uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Updated State (After)
                              </h4>
                              {renderValues("Updated", log.new_values)}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>

        {/* Premium Timeline Pagination Panel */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 pt-6">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold disabled:opacity-40 cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              Prev
            </button>
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold disabled:opacity-40 cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default AuditLogsPage;
