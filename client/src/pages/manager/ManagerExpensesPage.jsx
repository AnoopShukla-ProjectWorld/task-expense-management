import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers, FaMoneyBill, FaFileDownload, FaReceipt,
  FaCheck, FaTimes, FaEye, FaSearch, FaPlusCircle
} from "react-icons/fa";
import {
  getExpenses, createExpense, updateExpense,
  deleteExpense, reviewExpense
} from "../../services/expenseService";
import { getProjects } from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/tables/DataTable";
import EmptyState from "../../components/common/EmptyState";
import ExpenseModal from "../../components/modals/ExpenseModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { handleSafeDownload } from "../../utils/fileUtils";
import TableSearch from "../../components/tables/TableSearch";

// ─── Format category to plain text ──────────────────────────────────────────
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

// ─── Team Expenses Tab ────────────────────────────────────────────────────────
function TeamExpensesTab({ user }) {
  const queryClient = useQueryClient();
  const [reviewItem, setReviewItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "");

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => getExpenses({ limit: 10000 }),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects({ limit: 10000 }),
  });

  const managerProjectIds = projects
    .filter((p) => p.assigned_manager_id === user?.id)
    .map((p) => p.id);

  const teamExpenses = expenses.filter((e) =>
    managerProjectIds.includes(e.project_id)
  );

  const filteredExpenses = teamExpenses.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.employee_name?.toLowerCase().includes(q) ||
      e.task_title?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.amount?.toString().includes(q)
    );
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }) => reviewExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setReviewItem(null);
      setRejectionReason("");
      toast.success("Expense reviewed successfully");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to submit review"),
  });

  const handleReviewSubmit = (status) => {
    if (status === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setIsSubmitting(true);
    reviewMutation.mutate(
      { id: reviewItem.id, data: { status, rejection_reason: status === "REJECTED" ? rejectionReason : undefined } },
      { onSettled: () => setIsSubmitting(false) }
    );
  };

  const getStatusBadge = (row) => {
    if (row.status === "APPROVED")
      return <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap text-center">Approved</span>;
    if (row.status === "REJECTED")
      return <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-red-50 text-red-700 border-red-200 whitespace-nowrap text-center">Rejected</span>;
    if (row.manager_approval === "APPROVED")
      return <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200 whitespace-nowrap text-center">Awaiting Admin</span>;
    return <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 animate-pulse whitespace-nowrap text-center">Pending Review</span>;
  };

  const columns = [
    {
      key: "expense_date",
      title: "Date",
      render: (row) => row.expense_date ? new Date(row.expense_date).toLocaleDateString("en-IN") : "—",
    },
    {
      key: "employee_name",
      title: "Submitter",
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--text-primary)]">{row.employee_name || "Unknown"}</p>
          <p className="text-2xs text-[var(--text-secondary)] font-medium truncate max-w-[150px]" title={row.employee_email}>{row.employee_email || ""}</p>
        </div>
      ),
    },
    {
      key: "task_title",
      title: "Task / Project",
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--text-primary)] truncate max-w-[150px]">
            {row.task_title || <span className="text-[var(--text-secondary)] italic text-xs">General</span>}
          </p>
          {row.project_name && (
            <p className="text-3xs text-[var(--text-secondary)] mt-0.5">{row.project_name}</p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      title: "Category",
      render: (row) => (
        <span className="text-xs text-[var(--text-primary)] font-medium">
          {formatCategory(row.category)}
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
      render: (row) => getStatusBadge(row),
    },
    {
      key: "receipt",
      title: "Receipt",
      render: (row) => {
        if (!row.attachment_name)
          return <span className="text-xs text-[var(--text-secondary)] italic">None</span>;
        const fileUrl = `${backendBaseUrl}/uploads/expenses/${row.attachment_name}`;
        return (
          <button
            onClick={() => handleSafeDownload(fileUrl)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            <FaFileDownload /> View
          </button>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => {
        if (row.status !== "PENDING" || row.manager_approval === "APPROVED") {
          return (
            <button
              onClick={() => { setReviewItem({ ...row, readonly: true }); setRejectionReason(row.rejection_reason || ""); }}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-200 transition-all cursor-pointer"
            >
              <FaEye /> View Log
            </button>
          );
        }
        return (
          <button
            onClick={() => { setReviewItem(row); setRejectionReason(""); }}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
          >
            <FaReceipt /> Review
          </button>
        );
      },
    },
  ];

  const isLoading = expensesLoading || projectsLoading;

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden">
      {/* Search */}
      <TableSearch
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search submitter, task, category..."
      />

      {managerProjectIds.length === 0 ? (
        <EmptyState
          title="No Projects Under Management"
          description="You are not managing any projects. Expense claims will appear here once you're assigned a project."
        />
      ) : teamExpenses.length === 0 ? (
        <EmptyState
          title="No Team Expenses"
          description="No team members have submitted reimbursement claims for your projects yet."
        />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState title="No Results" description="No expenses match your search query." />
      ) : (
        <DataTable columns={columns} data={filteredExpenses} loading={isLoading} actions={false} />
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {reviewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-800/40 backdrop-blur-sm flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="glass-panel bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-md shadow-2xl text-[var(--text-primary)]"
            >
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FaReceipt className="text-blue-500" />
                {reviewItem.readonly ? "Expense Log" : "Review Reimbursement"}
              </h2>

              {/* Claim info */}
              <div className="bg-[var(--bg-primary)]/40 rounded-xl p-4 mb-4 space-y-2.5 border border-[var(--border-color)]">
                {[
                  ["Claimant", reviewItem.employee_name],
                  ["Email", reviewItem.employee_email || "—"],
                  ["Category", formatCategory(reviewItem.category)],
                  ["Amount", `₹${parseFloat(reviewItem.amount).toFixed(2)}`],
                  ["Task", reviewItem.task_title || "General"],
                  ["Project", reviewItem.project_name || "—"],
                  ["Date", new Date(reviewItem.expense_date).toLocaleDateString("en-IN")],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">{label}:</span>
                    <span className="font-bold text-[var(--text-primary)]">{val}</span>
                  </div>
                ))}
                {reviewItem.attachment_name && (
                  <div className="pt-2 flex justify-between items-center border-t border-[var(--border-color)]/60 text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">Receipt:</span>
                    <button
                      onClick={() => {
                        const fileUrl = `${backendBaseUrl}/uploads/expenses/${reviewItem.attachment_name}`;
                        handleSafeDownload(fileUrl);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 transition-all cursor-pointer focus:outline-none"
                    >
                      <FaFileDownload /> View Receipt
                    </button>
                  </div>
                )}
                {reviewItem.description && (
                  <div className="pt-2 border-t border-[var(--border-color)]/60">
                    <span className="text-xs text-[var(--text-secondary)] block mb-1">Description:</span>
                    <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-primary)]/60 p-2 rounded border border-[var(--border-color)]/60 italic">
                      {reviewItem.description}
                    </p>
                  </div>
                )}
              </div>

              {reviewItem.readonly ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border bg-[var(--bg-primary)]/40 border-[var(--border-color)]">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Review Outcome</span>
                    <p className={`text-sm font-extrabold uppercase mt-1 ${reviewItem.status === "APPROVED" ? "text-emerald-600" : "text-rose-500"}`}>
                      {reviewItem.status}
                    </p>
                    {reviewItem.rejection_reason && (
                      <div className="mt-2 pt-2 border-t border-[var(--border-color)]/60">
                        <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Rejection Reason:</span>
                        <p className="text-sm text-[var(--text-primary)] italic bg-[var(--bg-primary)]/60 p-2 rounded border border-[var(--border-color)]/60">
                          {reviewItem.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setReviewItem(null)}
                      className="px-5 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-xl font-semibold text-sm border border-[var(--border-color)] transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between">
                      <span>Rejection Reason</span>
                      <span className="text-rose-500 text-3xs font-semibold lowercase tracking-normal">(required to reject)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter reason if rejecting this expense request..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm transition-all shadow-sm"
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
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        <FaTimes className="text-xs" /> Reject
                      </button>
                      <button
                        onClick={() => handleReviewSubmit("APPROVED")}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        <FaCheck className="text-xs" /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── My Expenses Tab ──────────────────────────────────────────────────────────
function MyExpensesTab({ user }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "");

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", { my: true }],
    queryFn: () => getExpenses({ my: true, limit: 10000 }),
  });

  const myExpenses = expenses.filter((e) => e.user_id === user?.id);

  const filteredExpenses = myExpenses.filter((e) => {
    const q = searchQuery.toLowerCase();
    const projectTitle = e.project_name || "General";
    const amountStr = `₹${parseFloat(e.amount).toFixed(2)}`;
    let statusText = "Awaiting Admin";
    if (e.status === "APPROVED") statusText = "Approved";
    else if (e.status === "REJECTED") statusText = "Rejected";

    return (
      e.category?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      projectTitle.toLowerCase().includes(q) ||
      e.amount?.toString().includes(q) ||
      amountStr.toLowerCase().includes(q) ||
      statusText.toLowerCase().includes(q) ||
      (e.expense_date ? new Date(e.expense_date).toLocaleDateString().includes(q) : false)
    );
  });

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setIsModalOpen(false);
      toast.success("Expense claim filed successfully");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to file expense"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setIsModalOpen(false);
      setEditingExpense(null);
      toast.success("Expense updated successfully");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update expense"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setDeleteId(null);
      toast.success("Expense deleted successfully");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete expense"),
  });

  const handleSubmit = (formData) => {
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (row) => {
    if (row.status === "APPROVED")
      return <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap text-center">Approved</span>;
    if (row.status === "REJECTED")
      return <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border bg-red-50 text-red-700 border-red-200 whitespace-nowrap text-center">Rejected</span>;
    // manager_approval is auto-APPROVED for manager's own expense, so always awaiting admin
    return <span className="inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap text-center">Awaiting Admin</span>;
  };

  const columns = [
    {
      key: "expense_date",
      title: "Date",
      render: (row) => row.expense_date ? new Date(row.expense_date).toLocaleDateString() : "—",
    },
    {
      key: "project_name",
      title: "Linked Project",
      render: (row) => row.project_name || <span className="text-slate-400 italic">General</span>,
    },
    {
      key: "category",
      title: "Category",
      render: (row) => (
        <span className="text-xs text-[var(--text-primary)] font-medium">
          {formatCategory(row.category)}
        </span>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (row) => <span className="text-sm text-[var(--text-secondary)] line-clamp-1 max-w-xs">{row.description || "—"}</span>,
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => <span className="font-bold text-[var(--text-primary)]">₹{parseFloat(row.amount).toFixed(2)}</span>,
    },
    {
      key: "status",
      title: "Status",
      render: (row) => getStatusBadge(row),
    },
    {
      key: "receipt",
      title: "Receipt",
      render: (row) => {
        if (!row.attachment_name)
          return <span className="text-xs text-slate-400 italic">None</span>;
        const fileUrl = `${backendBaseUrl}/uploads/expenses/${row.attachment_name}`;
        return (
          <button
            onClick={() => handleSafeDownload(fileUrl)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            <FaFileDownload /> View
          </button>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <button
          onClick={() => navigate(`/manager/expenses/${row.id}`, { state: { fromTab: "my" } })}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
        >
          <FaEye className="text-[10px]" /> Timeline
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <TableSearch
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search expenses..."
        />
        <button
          onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
        >
          <FaPlusCircle /> Add Expense
        </button>
      </div>

      {myExpenses.length === 0 ? (
        <EmptyState
          title="No Claims Filed"
          description="You haven't filed any expense claims yet. Click 'Add Expense' to submit your first reimbursement request to Admin."
        />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState title="No Results" description="No expenses match your search query." />
      ) : (
        <DataTable columns={columns} data={filteredExpenses} loading={isLoading} actions={false} />
      )}

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        initialData={editingExpense}
      />

      {deleteId && (
        <ConfirmDialog
          title="Delete Claim"
          description="Are you sure you want to permanently delete this pending claim?"
          onCancel={() => setDeleteId(null)}
          onConfirm={() => deleteMutation.mutate(deleteId)}
        />
      )}
    </div>
  );
}

// ─── Main Combined Page ───────────────────────────────────────────────────────
function ManagerExpensesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "my");

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

  const tabs = [
    { id: "my", label: "My Expenses", icon: <FaMoneyBill />, desc: "File and track your own claims" },
    { id: "team", label: "Team Expenses", icon: <FaUsers />, desc: "Approve or reject team claims" },
  ];

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Expenses</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Manage team reimbursement approvals and file your own expense claims
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-3 border-b border-[var(--border-color)] pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer rounded-t-xl border border-b-0 -mb-px ${
              activeTab === tab.id
                ? "bg-[var(--bg-secondary)] border-[var(--border-color)] text-blue-600 shadow-sm"
                : "bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <span className={`text-base ${activeTab === tab.id ? "text-blue-500" : "text-[var(--text-secondary)]"}`}>
              {tab.icon}
            </span>
            <div className="text-left">
              <span className="block leading-tight">{tab.label}</span>
              <span className="text-[10px] font-normal text-[var(--text-secondary)] leading-tight hidden sm:block">
                {tab.desc}
              </span>
            </div>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "team" ? (
          <TeamExpensesTab user={user} />
        ) : (
          <MyExpensesTab user={user} />
        )}
      </div>
    </div>
  );
}

export default ManagerExpensesPage;
