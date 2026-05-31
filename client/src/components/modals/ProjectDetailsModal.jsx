import { motion } from "framer-motion";
import { FaTimes, FaCalendarAlt, FaStar, FaFilePdf, FaRupeeSign, FaUserTie } from "react-icons/fa";
import { handleSafeDownload } from "../../utils/fileUtils";

function ProjectDetailsModal({ project, onClose }) {
  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "");

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "HIGH": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "MEDIUM": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "COMPLETED": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "ON_HOLD": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-800/50 backdrop-blur-sm flex justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="glass-panel bg-[var(--bg-secondary)] border border-[var(--border-color)] w-full max-w-xl rounded-2xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start p-6 border-b border-[var(--border-color)]/60">
          <div className="space-y-1.5 flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getPriorityColor(project.priority)}`}>
                {project.priority} Priority
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-semibold border-l border-[var(--border-color)]/60 pl-2.5 flex items-center gap-1">
                <FaUserTie className="text-[10px] text-[var(--accent-blue)]" />
                Manager: {project.manager_name || "Unassigned"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] leading-snug truncate" title={project.project_name}>
              {project.project_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Description Block */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Project Objective & Scope</h4>
            <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)] leading-relaxed whitespace-pre-wrap">
              {project.description || "No project brief provided."}
            </p>
            {project.document_path && (
              <div className="p-3.5 bg-indigo-50 border border-indigo-100/80 rounded-xl flex items-center justify-between mt-2.5 shadow-sm shadow-indigo-600/5">
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <FaFilePdf className="text-rose-500 text-lg" />
                  <span className="truncate max-w-[280px]">Project Specification Blueprint.pdf</span>
                </div>
                <button
                  onClick={() => {
                    const fileUrl = project.document_path.startsWith('http') 
                      ? project.document_path 
                      : `${backendBaseUrl}${project.document_path}`;
                    handleSafeDownload(fileUrl);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-lg text-2xs font-extrabold uppercase tracking-wider transition-all shadow-sm shadow-indigo-600/10 cursor-pointer flex items-center gap-1.5 focus:outline-none"
                >
                  <span>Download Blueprint</span>
                </button>
              </div>
            )}
          </div>

          {/* Project Metas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl flex items-center gap-3">
              <FaCalendarAlt className="text-indigo-400 text-lg" />
              <div>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Dates</p>
                <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5">
                  {new Date(project.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} - 
                  {project.end_date ? ` ${new Date(project.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : " Ongoing"}
                </p>
              </div>
            </div>
            <div className="p-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl flex items-center gap-3">
              <FaStar className={`text-lg animate-pulse ${project.status === 'ACTIVE' ? 'text-emerald-400' : 'text-blue-400'}`} />
              <div>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Status</p>
                <p className={`text-xs font-bold mt-0.5 uppercase tracking-wide ${getStatusColor(project.status)}`}>
                  {project.status}
                </p>
              </div>
            </div>
            <div className="p-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl flex items-center gap-3">
              <FaRupeeSign className="text-amber-400 text-lg" />
              <div>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Allocated Budget</p>
                <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5">
                  {project.budget ? `₹${parseFloat(project.budget).toLocaleString()}` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl space-y-2">
            <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)] uppercase">
              <span>Overall Completion Meter</span>
              <span className="text-[var(--accent-blue)]">{project.completion_percentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--border-color)] overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${project.completion_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[var(--bg-tertiary)]/40 border-t border-[var(--border-color)]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-primary)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ProjectDetailsModal;

