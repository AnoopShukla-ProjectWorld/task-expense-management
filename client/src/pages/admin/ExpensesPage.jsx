import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getExpenses, reviewExpense } from "../../services/expenseService";
import DataTable from "../../components/tables/DataTable";
import { FaFileDownload, FaReceipt, FaCheck, FaTimes, FaEye } from "react-icons/fa";
import { handleSafeDownload } from "../../utils/fileUtils";

function ExpensesPage() {
  const queryClient = useQueryClient();
  const [reviewItem, setReviewItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => getExpenses({ limit: 10000 }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }) => reviewExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setReviewItem(null);
      setRejectionReason("");
      toast.success("Expense reviewed successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit review");
    },
  });

  const handleReviewSubmit = (status) => {
    if (status === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setIsSubmitting(true);
    reviewMutation.mutate(
      {
        id: reviewItem.id,
        data: {
          status,
          rejection_reason: status === "REJECTED" ? rejectionReason : undefined,
        },
      },
      {
        onSettled: () => setIsSubmitting(false),
      }
    );
  };

  const getCategoryBadgeClass = (category) => {
    const badges = {
      HARDWARE: "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]",
      SOFTWARE_LICENSE: "bg-purple-500/10 text-purple-600 border-purple-500/20 shadow-[0_0_10px_rgba(139,92,246,0.05)]",
      TRAVEL_TRAVEL: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.05)]",
      MEALS_REFRESHMENT: "bg-orange-500/10 text-orange-600 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]",
      TRAINING_MEMBERSHIP: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.05)]",
    };
    return badges[category] || "bg-slate-500/10 text-slate-600 border-slate-500/20";
  };

  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "");

  const columns = [
    {
      key: "expense_date",
      title: "Date",
      render: (row) => (row.expense_date ? new Date(row.expense_date).toLocaleDateString("en-IN") : "—"),
    },
    {
      key: "employee_name",
      title: "Submitter",
      render: (row) => (
        <div>
          <p className="font-bold text-[var(--text-primary)] leading-tight">{row.employee_name || "Unknown User"}</p>
          <p className="text-xs text-[var(--text-secondary)]">{row.employee_email || ""}</p>
        </div>
      ),
    },
    {
      key: "task_title",
      title: "Assigned Task",
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--text-primary)] truncate max-w-[150px]">
            {row.task_title || <span className="text-[var(--text-secondary)] italic font-sans text-xs">General / Unlinked</span>}
          </p>
          {row.project_name && (
            <p className="text-3xs text-[var(--text-secondary)] font-sans tracking-wide mt-0.5">Project: {row.project_name}</p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      title: "Category",
      render: (row) => (
        <span className={`inline-flex justify-center items-center w-48 px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide border text-center ${getCategoryBadgeClass(row.category)}`}>
          {row.category}
        </span>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (row) => <span className="text-xs text-[var(--text-secondary)] line-clamp-1 max-w-xs font-sans">{row.description || "—"}</span>,
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => <span className="font-extrabold text-[var(--text-primary)]">₹{parseFloat(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
    },
    {
      key: "status",
      title: "Status",
      render: (row) => {
        if (row.status === "APPROVED") {
          return (
            <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap shadow-sm text-center">
              Approved
            </span>
          );
        }
        if (row.status === "REJECTED") {
          return (
            <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 whitespace-nowrap shadow-sm text-center">
              Rejected
            </span>
          );
        }
        if (row.project_id && row.manager_approval === "PENDING") {
          return (
            <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 whitespace-nowrap animate-pulse shadow-sm text-center">
              Awaiting Mgr
            </span>
          );
        }
        if (row.manager_approval === "APPROVED") {
          return (
            <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20 whitespace-nowrap animate-pulse shadow-sm text-center">
              Awaiting Admin
            </span>
          );
        }
        return (
          <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 whitespace-nowrap animate-pulse shadow-sm text-center">
            Pending
          </span>
        );
      },
    },
    {
      key: "receipt",
      title: "Receipt",
      render: (row) => {
        if (!row.attachment_name) return <span className="text-xs text-slate-500 italic">No receipt</span>;
        const fileUrl = `${backendBaseUrl}/uploads/expenses/${row.attachment_name}`;
        return (
          <button
            onClick={() => handleSafeDownload(fileUrl)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-violet-500/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none"
          >
            <FaFileDownload /> Download
          </button>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => {
        if (row.status !== "PENDING") {
          return (
            <button
              onClick={() => {
                setReviewItem({ ...row, readonly: true });
                setRejectionReason(row.rejection_reason || "");
              }}
              className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-violet-500/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FaEye /> View Log
            </button>
          );
        }
        if (row.project_id && row.manager_approval === "PENDING") {
          return (
            <button
              disabled
              className="px-3 py-1.5 bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] text-[var(--text-secondary)]/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-not-allowed"
            >
              <FaReceipt /> Awaiting Manager
            </button>
          );
        }
        return (
          <button
            onClick={() => {
              setReviewItem(row);
              setRejectionReason("");
            }}
            className="px-3 py-1.5 bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600 text-violet-600 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-glow"
          >
            <FaReceipt /> Review
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Enterprise Expenses</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Audit, review, and handle expense reimbursements across all roles</p>
      </div>

      <DataTable
        columns={columns}
        data={expenses || []}
        loading={isLoading}
        actions={false}
      />

      <AnimatePresence>
        {reviewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewItem(null)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-md glass-panel rounded-3xl p-6.5 border border-[var(--border-color)] shadow-2xl relative overflow-hidden z-10 my-8 bg-[var(--bg-secondary)]"
            >
              {/* Decorative background ambient lighting */}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

              <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <FaReceipt className="text-violet-500" />
                {reviewItem.readonly ? "Expense Log" : "Expense Review Decision"}
              </h2>

              <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl p-4.5 mb-4.5 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">Employee:</span>
                  <span className="font-bold text-[var(--text-primary)]">{reviewItem.employee_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">Email:</span>
                  <span className="font-bold text-[var(--text-primary)]">{reviewItem.employee_email || "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">Category:</span>
                  <span className="font-bold text-[var(--text-primary)] uppercase">{reviewItem.category}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">Amount:</span>
                  <span className="font-extrabold text-emerald-600">₹{parseFloat(reviewItem.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">Date:</span>
                  <span className="font-bold text-[var(--text-primary)]">{new Date(reviewItem.expense_date).toLocaleDateString()}</span>
                </div>
                {reviewItem.task_title && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">Task:</span>
                    <span className="font-bold text-[var(--text-primary)]">{reviewItem.task_title}</span>
                  </div>
                )}
                {reviewItem.project_name && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">Project:</span>
                    <span className="font-bold text-[var(--text-primary)]">{reviewItem.project_name}</span>
                  </div>
                )}
                {reviewItem.attachment_name && (
                  <div className="pt-2 flex justify-between items-center border-t border-[var(--border-color)] text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">Receipt:</span>
                    <button
                      onClick={() => {
                        const fileUrl = `${backendBaseUrl}/uploads/expenses/${reviewItem.attachment_name}`;
                        handleSafeDownload(fileUrl);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-violet-500/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none"
                    >
                      <FaFileDownload /> Download
                    </button>
                  </div>
                )}
                {reviewItem.description && (
                  <div className="pt-2.5 border-t border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-secondary)] block mb-1 uppercase font-bold tracking-wider">Description</span>
                    <p className="text-xs text-[var(--text-primary)] italic bg-[var(--bg-secondary)] p-2.5 rounded-xl border border-[var(--border-color)] font-sans leading-relaxed">{reviewItem.description}</p>
                  </div>
                )}
              </div>

              {reviewItem.readonly ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl border flex flex-col gap-1.5 bg-[var(--bg-tertiary)] border-[var(--border-color)]">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Review Result</span>
                    <span className={`text-sm font-extrabold uppercase ${reviewItem.status === "APPROVED" ? "text-emerald-600" : "text-rose-600"}`}>
                      {reviewItem.status}
                    </span>
                    {reviewItem.rejection_reason && (
                      <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] block mb-1 uppercase tracking-wider">Rejection Reason:</span>
                        <p className="text-xs text-[var(--text-primary)] bg-[var(--bg-secondary)] p-2.5 rounded-xl border border-[var(--border-color)] italic font-sans">{reviewItem.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setReviewItem(null)}
                      className="px-5 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold rounded-2xl text-xs transition-colors cursor-pointer border border-[var(--border-color)]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between">
                      <span>Rejection Reason</span>
                      <span className="text-rose-500 text-3xs font-semibold lowercase tracking-normal">(required to reject)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Provide a specific rationale if rejecting this expense..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full rounded-2xl bg-[var(--bg-primary)] border border-slate-300 dark:border-[var(--border-color)] px-4 py-3 outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none resize-none transition-all shadow-sm"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)] gap-3">
                    <button
                      onClick={() => setReviewItem(null)}
                      className="px-5 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold rounded-2xl text-xs transition-colors cursor-pointer border border-[var(--border-color)]"
                    >
                      Cancel
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReviewSubmit("REJECTED")}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600 text-rose-600 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-rose-500/10"
                      >
                        <FaTimes /> Reject
                      </button>
                      <button
                        onClick={() => handleReviewSubmit("APPROVED")}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10"
                      >
                        <FaCheck /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExpensesPage;
