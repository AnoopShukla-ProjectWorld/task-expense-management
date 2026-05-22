import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getExpenses, reviewExpense } from "../../services/expenseService";
import DataTable from "../../components/tables/DataTable";
import { FaFileDownload, FaReceipt, FaCheck, FaTimes, FaEye } from "react-icons/fa";

function ExpensesPage() {
  const queryClient = useQueryClient();
  const [reviewItem, setReviewItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: getExpenses,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }) => reviewExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
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
      TRAVEL: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]",
      FOOD: "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]",
      ACCOMMODATION: "bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.05)]",
      OFFICE_SUPPLIES: "bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.05)]",
      MISCELLANEOUS: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return badges[category] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "");

  const columns = [
    {
      key: "expense_date",
      title: "Date",
      render: (row) => (row.expense_date ? new Date(row.expense_date).toLocaleDateString() : "—"),
    },
    {
      key: "employee_name",
      title: "Submitter",
      render: (row) => (
        <div>
          <p className="font-semibold text-white">{row.employee_name || "Unknown User"}</p>
          <p className="text-xs text-slate-400">{row.employee_email || ""}</p>
        </div>
      ),
    },
    {
      key: "project_name",
      title: "Project",
      render: (row) => row.project_name || <span className="text-slate-500 italic font-sans text-xs">General / None</span>,
    },
    {
      key: "category",
      title: "Category",
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide border ${getCategoryBadgeClass(row.category)}`}>
          {row.category}
        </span>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (row) => <span className="text-xs text-slate-400 line-clamp-1 max-w-xs font-sans">{row.description || "—"}</span>,
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => <span className="font-extrabold text-white">₹{parseFloat(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide border ${
          row.status === "APPROVED"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
            : row.status === "REJECTED"
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
            : "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)] animate-pulse"
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "receipt",
      title: "Receipt",
      render: (row) => {
        if (!row.attachment_name) return <span className="text-xs text-slate-500 italic">No receipt</span>;
        const fileUrl = `${backendBaseUrl}/uploads/expenses/${row.attachment_name}`;
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/5 border border-white/5 hover:border-violet-500/30 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
          >
            <FaFileDownload /> Download
          </a>
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
              className="px-3 py-1.5 bg-white/5 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FaEye /> View Audit
            </button>
          );
        }
        return (
          <button
            onClick={() => {
              setReviewItem(row);
              setRejectionReason("");
            }}
            className="px-3 py-1.5 bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600 text-violet-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-glow"
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
              className="fixed inset-0 bg-slate-955/65 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-md glass-panel rounded-3xl p-6.5 border border-white/10 shadow-2xl relative overflow-hidden z-10 my-8"
            >
              {/* Decorative background ambient lighting */}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

              <h2 className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4 flex items-center gap-2">
                <FaReceipt className="text-violet-400" />
                {reviewItem.readonly ? "Audit Log View" : "Expense Review Decision"}
              </h2>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4.5 mb-4.5 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Employee:</span>
                  <span className="font-bold text-white">{reviewItem.employee_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Category:</span>
                  <span className="font-bold text-white uppercase">{reviewItem.category}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Amount:</span>
                  <span className="font-extrabold text-emerald-400">₹{parseFloat(reviewItem.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Date:</span>
                  <span className="font-bold text-white">{new Date(reviewItem.expense_date).toLocaleDateString()}</span>
                </div>
                {reviewItem.project_name && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">Project:</span>
                    <span className="font-bold text-white">{reviewItem.project_name}</span>
                  </div>
                )}
                {reviewItem.description && (
                  <div className="pt-2.5 border-t border-white/5">
                    <span className="text-[10px] text-slate-500 block mb-1 uppercase font-bold tracking-wider">Description</span>
                    <p className="text-xs text-slate-300 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5 font-sans leading-relaxed">{reviewItem.description}</p>
                  </div>
                )}
              </div>

              {reviewItem.readonly ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl border flex flex-col gap-1.5 bg-white/[0.01] border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Review Result</span>
                    <span className={`text-sm font-extrabold uppercase ${reviewItem.status === "APPROVED" ? "text-emerald-400" : "text-rose-400"}`}>
                      {reviewItem.status}
                    </span>
                    {reviewItem.rejection_reason && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Rejection Reason:</span>
                        <p className="text-xs text-slate-300 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 italic font-sans">{reviewItem.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setReviewItem(null)}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
                    >
                      Close Log
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejection Reason</label>
                    <textarea
                      rows={2.5}
                      placeholder="Provide a specific rationale if rejecting this expense..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-3 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 focus:bg-white/[0.07] text-xs text-white placeholder-slate-500 outline-none resize-none transition-all"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/5 gap-3">
                    <button
                      onClick={() => setReviewItem(null)}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReviewSubmit("REJECTED")}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-rose-500/10"
                      >
                        <FaTimes /> Reject
                      </button>
                      <button
                        onClick={() => handleReviewSubmit("APPROVED")}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10"
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