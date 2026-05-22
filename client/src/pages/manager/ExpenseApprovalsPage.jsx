import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getExpenses, reviewExpense } from "../../services/expenseService";
import { getProjects } from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/tables/DataTable";
import EmptyState from "../../components/common/EmptyState";
import { FaFileDownload, FaReceipt, FaCheck, FaTimes, FaEye } from "react-icons/fa";

function ExpenseApprovalsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewItem, setReviewItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch expenses
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: getExpenses,
  });

  // Fetch projects to determine which ones this manager oversees
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const managerProjectIds = projects
    ?.filter((p) => p.assigned_manager_id === user?.id)
    .map((p) => p.id) || [];

  // Filter expenses linked to projects managed by this manager
  const teamExpenses = expenses?.filter((e) => managerProjectIds.includes(e.project_id)) || [];

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

  const getCategoryBadge = (category) => {
    const badges = {
      TRAVEL: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      FOOD: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
      ACCOMMODATION: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      OFFICE_SUPPLIES: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
      MISCELLANEOUS: "bg-slate-500/10 text-[var(--text-secondary)] border-[var(--border-color)]",
    };
    return badges[category] || "bg-slate-500/10 text-[var(--text-secondary)] border-[var(--border-color)]";
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
          <p className="font-semibold text-[var(--text-primary)]">{row.employee_name || "Unknown User"}</p>
          <p className="text-2xs text-[var(--text-secondary)]/80 font-medium">{row.employee_email || ""}</p>
        </div>
      ),
    },
    {
      key: "project_name",
      title: "Project",
      render: (row) => row.project_name || "—",
    },
    {
      key: "category",
      title: "Category",
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border ${getCategoryBadge(row.category)}`}>
          {row.category}
        </span>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => <span className="font-bold text-[var(--text-primary)]">₹{parseFloat(row.amount).toFixed(2)}</span>,
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border ${
          row.status === "APPROVED"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            : row.status === "REJECTED"
            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse"
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "receipt",
      title: "Receipt",
      render: (row) => {
        if (!row.attachment_name) return <span className="text-xs text-[var(--text-secondary)] italic">No receipt</span>;
        const fileUrl = `${backendBaseUrl}/uploads/expenses/${row.attachment_name}`;
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--bg-primary)]/40 hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-xs font-bold border border-[var(--border-color)] transition-colors cursor-pointer"
          >
            <FaFileDownload /> View File
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
              className="px-2.5 py-1 bg-[var(--bg-primary)]/40 hover:bg-[var(--bg-primary)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all border border-[var(--border-color)] cursor-pointer"
            >
              <FaEye /> View Log
            </button>
          );
        }
        return (
          <button
            onClick={() => {
              setReviewItem(row);
              setRejectionReason("");
            }}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
          >
            <FaReceipt /> Review
          </button>
        );
      },
    },
  ];

  const isLoading = expensesLoading || projectsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Expense Approvals</h1>
        <p className="text-[var(--text-secondary)]">Audit, approve, or reject employee reimbursement claims inside your projects</p>
      </div>

      {managerProjectIds.length === 0 ? (
        <EmptyState
          title="No Projects Under Management"
          description="You are currently not managing any projects. You will be able to review expense claims here once you are assigned to a project."
        />
      ) : teamExpenses.length === 0 ? (
        <EmptyState
          title="No Team Expenses"
          description="No employees have submitted reimbursement claims for your managed projects yet."
        />
      ) : (
        <DataTable
          columns={columns}
          data={teamExpenses}
          loading={isLoading}
          actions={false}
        />
      )}

      {reviewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="glass-panel bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 text-[var(--text-primary)]">
            <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)] flex items-center gap-2">
              <FaReceipt className="text-blue-500" />
              {reviewItem.readonly ? "Expense Log History" : "Review Reimbursement Request"}
            </h2>

            <div className="bg-[var(--bg-primary)]/40 rounded-xl p-4 mb-4 space-y-2 border border-[var(--border-color)]">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)] font-medium">Claimant:</span>
                <span className="font-bold text-[var(--text-primary)]">{reviewItem.employee_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)] font-medium">Category:</span>
                <span className="font-bold text-[var(--text-primary)] uppercase text-xs">{reviewItem.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)] font-medium">Amount:</span>
                <span className="font-extrabold text-blue-500">₹{parseFloat(reviewItem.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)] font-medium">Project:</span>
                <span className="font-bold text-[var(--text-primary)]">{reviewItem.project_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)] font-medium">Date:</span>
                <span className="font-bold text-[var(--text-primary)]">{new Date(reviewItem.expense_date).toLocaleDateString("en-IN")}</span>
              </div>
              {reviewItem.description && (
                <div className="pt-2 border-t border-[var(--border-color)]/60">
                  <span className="text-xs text-[var(--text-secondary)] block mb-1">Description:</span>
                  <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-primary)]/60 p-2 rounded border border-[var(--border-color)]/60 italic">{reviewItem.description}</p>
                </div>
              )}
            </div>

            {reviewItem.readonly ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border flex flex-col gap-1 bg-[var(--bg-primary)]/40 border-[var(--border-color)]">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Review Outcome</span>
                  <span className={`text-sm font-extrabold uppercase ${reviewItem.status === "APPROVED" ? "text-emerald-500" : "text-rose-500"}`}>
                    {reviewItem.status}
                  </span>
                  {reviewItem.rejection_reason && (
                    <div className="mt-2 pt-2 border-t border-[var(--border-color)]/60">
                      <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Rejection Reason:</span>
                      <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-primary)]/60 p-2.5 rounded border border-[var(--border-color)]/60 italic">{reviewItem.rejection_reason}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-3">
                  <button
                    onClick={() => setReviewItem(null)}
                    className="px-6 py-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-primary)]/80 text-[var(--text-primary)] rounded-xl font-bold transition-all text-sm border border-[var(--border-color)] cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Rejection Reason</label>
                  <textarea
                    rows={2.5}
                    placeholder="Enter reason if rejecting expense request..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/45 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm transition-all duration-300"
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)]/60 gap-3">
                  <button
                    onClick={() => setReviewItem(null)}
                    className="px-4 py-2.5 border border-[var(--border-color)] bg-[var(--bg-primary)]/40 hover:bg-[var(--bg-primary)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewSubmit("REJECTED")}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-650 hover:from-rose-500 hover:to-red-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-red-500/10 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <FaTimes /> Reject
                    </button>
                    <button
                      onClick={() => handleReviewSubmit("APPROVED")}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <FaCheck /> Approve
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseApprovalsPage;
