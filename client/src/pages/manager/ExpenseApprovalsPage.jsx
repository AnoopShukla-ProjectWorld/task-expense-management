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
      TRAVEL: "bg-blue-50 text-blue-700 border-blue-200",
      FOOD: "bg-orange-50 text-orange-700 border-orange-200",
      ACCOMMODATION: "bg-purple-50 text-purple-700 border-purple-200",
      OFFICE_SUPPLIES: "bg-pink-50 text-pink-700 border-pink-200",
      MISCELLANEOUS: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return badges[category] || "bg-gray-50 text-gray-700 border-gray-200";
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
          <p className="font-semibold text-gray-800">{row.employee_name || "Unknown User"}</p>
          <p className="text-2xs text-gray-400 font-medium">{row.employee_email || ""}</p>
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
            ? "bg-emerald-100 text-emerald-850 border-emerald-250"
            : row.status === "REJECTED"
            ? "bg-red-100 text-red-850 border-red-255"
            : "bg-amber-100 text-amber-850 border-amber-255 animate-pulse"
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "receipt",
      title: "Receipt",
      render: (row) => {
        if (!row.attachment_name) return <span className="text-xs text-gray-400 italic">No receipt</span>;
        const fileUrl = `${backendBaseUrl}/uploads/expenses/${row.attachment_name}`;
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded-lg text-xs font-bold border border-gray-150 transition-colors"
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
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-gray-200"
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
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
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
        <h1 className="text-3xl font-bold">Expense Approvals</h1>
        <p className="text-gray-500">Audit, approve, or reject employee reimbursement claims inside your projects</p>
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
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <FaReceipt className="text-blue-500" />
              {reviewItem.readonly ? "Expense Log History" : "Review Reimbursement Request"}
            </h2>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 border border-gray-150">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Claimant:</span>
                <span className="font-bold text-gray-800">{reviewItem.employee_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Category:</span>
                <span className="font-bold text-gray-800 uppercase text-xs">{reviewItem.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Amount:</span>
                <span className="font-extrabold text-blue-600">₹{parseFloat(reviewItem.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Project:</span>
                <span className="font-bold text-gray-800">{reviewItem.project_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Date:</span>
                <span className="font-bold text-gray-800">{new Date(reviewItem.expense_date).toLocaleDateString()}</span>
              </div>
              {reviewItem.description && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-400 block mb-1">Description:</span>
                  <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-100 italic">{reviewItem.description}</p>
                </div>
              )}
            </div>

            {reviewItem.readonly ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border flex flex-col gap-1 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-400">Review Outcome</span>
                  <span className={`text-sm font-extrabold uppercase ${reviewItem.status === "APPROVED" ? "text-emerald-600" : "text-red-600"}`}>
                    {reviewItem.status}
                  </span>
                  {reviewItem.rejection_reason && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs font-semibold text-gray-400 block mb-1">Rejection Reason:</span>
                      <p className="text-sm text-gray-605 bg-white p-2.5 rounded border border-gray-100 italic">{reviewItem.rejection_reason}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-3">
                  <button
                    onClick={() => setReviewItem(null)}
                    className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold transition-all text-sm shadow-md"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Rejection Reason</label>
                  <textarea
                    rows={2.5}
                    placeholder="Enter reason if rejecting expense request..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-150 gap-3">
                  <button
                    onClick={() => setReviewItem(null)}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewSubmit("REJECTED")}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 bg-red-650 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-red-500/10 flex items-center gap-1 disabled:opacity-50"
                    >
                      <FaTimes /> Reject
                    </button>
                    <button
                      onClick={() => handleReviewSubmit("APPROVED")}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1 disabled:opacity-50"
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
