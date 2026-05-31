import { motion } from "framer-motion";
import { FaTimes, FaCalendarAlt, FaReceipt, FaCheckCircle, FaUser, FaInfoCircle, FaFileDownload, FaClock, FaExclamationCircle } from "react-icons/fa";
import { handleSafeDownload } from "../../utils/fileUtils";

function ExpenseDetailsModal({ expense, onClose, onEdit, onDelete }) {
  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "");
  const isEditable = expense.status === "PENDING" && expense.manager_approval === "PENDING";

  const formatCategory = (category) => {
    if (!category) return "—";
    const mapping = {
      HARDWARE: "Hardware",
      SOFTWARE_LICENSE: "Software License",
      TRAVEL_TRAVEL: "Travel & Commute",
      MEALS_REFRESHMENT: "Meals & Refreshments",
      TRAINING_MEMBERSHIP: "Training & Membership",
    };
    return mapping[category] || category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  // Determine Stepper States
  const isManagerReviewed = expense.manager_approval === "APPROVED" || expense.manager_approval === "REJECTED";
  const isManagerApproved = expense.manager_approval === "APPROVED";
  const isManagerRejected = expense.manager_approval === "REJECTED";

  const isAdminReviewed = expense.status === "APPROVED" || expense.status === "REJECTED";
  const isAdminApproved = expense.status === "APPROVED";
  const isAdminRejected = expense.status === "REJECTED";

  return (
    <div className="fixed inset-0 z-50 bg-slate-800/50 backdrop-blur-sm flex justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="glass-panel bg-[var(--bg-secondary)] border border-[var(--border-color)] w-full max-w-2xl rounded-2xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start p-6 border-b border-[var(--border-color)]/60">
          <div className="space-y-1.5 flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                Category: <span className="text-[var(--text-primary)] font-extrabold">{formatCategory(expense.category)}</span>
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-semibold border-l border-[var(--border-color)]/60 pl-2.5">
                Task: {expense.task_title || "General Claim"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] leading-snug truncate">
              Expense Audit Log
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left side: Claim summary */}
            <div className="space-y-5">
              <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl flex flex-col justify-center">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Claim Amount</span>
                <span className="text-3xl font-extrabold text-[var(--text-primary)] mt-1">
                  ₹{parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Reason / Description</h4>
                <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                  {expense.description || "No specific details were logged for this supply request."}
                </p>
              </div>

              {expense.attachment_name && (
                <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                    <FaReceipt className="text-blue-500 text-lg" />
                    <span className="truncate max-w-[150px]">{expense.attachment_name}</span>
                  </div>
                  <button
                    onClick={() => {
                      const fileUrl = `${backendBaseUrl}/uploads/expenses/${expense.attachment_name}`;
                      handleSafeDownload(fileUrl);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded-lg text-xs font-bold border border-gray-150 transition-colors cursor-pointer focus:outline-none"
                  >
                    <FaFileDownload /> View Receipt
                  </button>
                </div>
              )}
            </div>

            {/* Right side: Sleek Workflow Stepper Timeline */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Workflow Routing Status</h4>
              
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border-color)]">
                
                {/* Step 1: Created */}
                <div className="relative">
                  <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white">âœ“</span>
                  <div>
                    <h5 className="text-sm font-bold text-[var(--text-primary)]">Claim Submitted</h5>
                    <p className="text-3xs text-[var(--text-secondary)] font-medium mt-0.5 flex items-center gap-1">
                      <FaCalendarAlt /> {new Date(expense.expense_date || expense.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-2xs text-[var(--text-secondary)] mt-1 font-sans">
                      Filed by employee against assigned task.
                    </p>
                  </div>
                </div>

                {/* Step 2: Manager Review */}
                <div className="relative">
                  {isManagerApproved ? (
                    <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white">âœ“</span>
                  ) : isManagerRejected ? (
                    <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[8px] text-white">âœ—</span>
                  ) : (
                    <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[8px] text-white animate-pulse">â°</span>
                  )}
                  <div>
                    <h5 className="text-sm font-bold text-[var(--text-primary)] flex justify-between">
                      <span>Manager Review</span>
                      <span className={`text-3xs font-extrabold px-1.5 py-0.5 rounded border uppercase whitespace-nowrap inline-block ${
                        isManagerApproved ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                        isManagerRejected ? "text-rose-600 bg-rose-50 border-rose-100" :
                        "text-amber-600 bg-amber-50 border-amber-100"
                      }`}>
                        {isManagerApproved ? "Approved" : isManagerRejected ? "Rejected" : "Pending"}
                      </span>
                    </h5>
                    {isManagerReviewed && (
                      <p className="text-3xs text-[var(--text-secondary)] font-medium mt-0.5">
                        Reviewed by: <span className="font-bold">{expense.manager_name || "Assigned Manager"}</span>
                      </p>
                    )}
                    {isManagerRejected && expense.rejection_reason && (
                      <div className="mt-1.5 p-2 bg-red-50 border border-red-100 rounded-lg text-2xs text-rose-600 flex gap-1">
                        <FaExclamationCircle className="flex-shrink-0 mt-0.5" />
                        <span>Reason: {expense.rejection_reason}</span>
                      </div>
                    )}
                    {!isManagerReviewed && (
                      <p className="text-2xs text-[var(--text-secondary)] mt-1 font-sans">
                        Awaiting initial sign-off from operational manager.
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 3: Admin Review */}
                <div className="relative">
                  {isAdminApproved ? (
                    <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white">✓</span>
                  ) : isAdminRejected ? (
                    <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[8px] text-white">✗</span>
                  ) : (
                    <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px]" />
                  )}
                  <div>
                    <h5 className="text-sm font-bold text-[var(--text-primary)] flex justify-between">
                      <span>Administrator Audit</span>
                      <span className={`text-3xs font-extrabold px-1.5 py-0.5 rounded border uppercase whitespace-nowrap inline-block ${
                        isAdminApproved ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                        isAdminRejected ? "text-rose-600 bg-rose-50 border-rose-100" :
                        "text-slate-500 bg-slate-50 border-slate-100"
                      }`}>
                        {isAdminApproved ? "Disbursed" : isAdminRejected ? "Rejected" : "Awaiting Audit"}
                      </span>
                    </h5>
                    {isAdminReviewed && (
                      <p className="text-3xs text-[var(--text-secondary)] font-medium mt-0.5">
                        Audited by: <span className="font-bold">{expense.admin_name || "Finance Admin"}</span>
                      </p>
                    )}
                    {isAdminRejected && expense.rejection_reason && (
                      <div className="mt-1.5 p-2 bg-red-50 border border-red-100 rounded-lg text-2xs text-rose-600 flex gap-1">
                        <FaExclamationCircle className="flex-shrink-0 mt-0.5" />
                        <span>Reason: {expense.rejection_reason}</span>
                      </div>
                    )}
                    {!isAdminReviewed && (
                      <p className="text-2xs text-[var(--text-secondary)] mt-1 font-sans">
                        Final corporate disbursement and budget settlement audit.
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[var(--bg-tertiary)]/40 border-t border-[var(--border-color)]/60 flex justify-between items-center">
          <div className="flex gap-2">
            {isEditable && onEdit && onDelete && (
              <>
                <button
                  onClick={() => onEdit(expense)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Edit Claim
                </button>
                <button
                  onClick={() => onDelete(expense.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-650 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Delete Claim
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-primary)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs transition-colors cursor-pointer"
          >
            Close Timeline
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ExpenseDetailsModal;

