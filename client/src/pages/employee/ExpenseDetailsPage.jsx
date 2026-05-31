import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { 
  FaArrowLeft, FaCalendarAlt, FaReceipt, FaCheckCircle, 
  FaUser, FaInfoCircle, FaFileDownload, FaClock, FaExclamationCircle, 
  FaEdit, FaTrash 
} from "react-icons/fa";
import { getExpenses, updateExpense, deleteExpense } from "../../services/expenseService";
import { useAuth } from "../../context/AuthContext";
import { handleSafeDownload } from "../../utils/fileUtils";
import PageLoader from "../../components/loaders/PageLoader";
import ExpenseModal from "../../components/modals/ExpenseModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";

function ExpenseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const rolePath = user?.role === "MANAGER" ? "manager/expenses" : "employee/expenses";
  // Manager's own expenses skip manager review step — show 2-step timeline only
  const isManagerExpense = user?.role === "MANAGER";
  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "");

  // Fetch expenses (managers fetch all team claims, employees fetch only personal claims)
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", { my: !isManagerExpense }],
    queryFn: () => getExpenses(isManagerExpense ? {} : { my: true }),
  });

  const expense = expenses.find((e) => e.id === Number(id));

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      setIsEditOpen(false);
      toast.success("Expense updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update expense");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      setIsDeleteOpen(false);
      toast.success("Expense deleted successfully");
      if (location.state?.fromTab === "my") {
        navigate("/manager/expenses", { state: { activeTab: "my" } });
      } else {
        navigate(`/${rolePath}`);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete expense");
    },
  });

  if (isLoading) return <PageLoader />;

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <FaExclamationCircle className="text-rose-500 text-5xl animate-bounce" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Claim Record Not Found</h2>
        <p className="text-[var(--text-secondary)] text-sm">The requested expense audit log could not be loaded.</p>
        <button
          onClick={() => navigate(`/${rolePath}`)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <FaArrowLeft /> Return to Workspace
        </button>
      </div>
    );
  }

  const isEditable = expense.status === "PENDING" && (
    isManagerExpense
      ? true  // manager: editable as long as status = PENDING (admin hasn't reviewed)
      : expense.manager_approval === "PENDING"  // employee: only before manager reviews
  );

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

  const isManagerReviewed = expense.manager_approval === "APPROVED" || expense.manager_approval === "REJECTED";
  const isManagerApproved = expense.manager_approval === "APPROVED";
  const isManagerRejected = expense.manager_approval === "REJECTED";

  const isAdminReviewed = expense.status === "APPROVED" || expense.status === "REJECTED";
  const isAdminApproved = expense.status === "APPROVED";
  const isAdminRejected = expense.status === "REJECTED";

  const handleEditSubmit = (formData) => {
    updateMutation.mutate({ id: expense.id, data: formData });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <button
            onClick={() => {
              if (location.state?.fromTab === "my") {
                navigate("/manager/expenses", { state: { activeTab: "my" } });
              } else {
                navigate(`/${rolePath}`);
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors mb-2 cursor-pointer"
          >
            <FaArrowLeft /> Back to Expense Claims
          </button>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Expense Audit Log</h1>
          <p className="text-[var(--text-secondary)] text-sm">Detailed workflow trace and validation history for this claim</p>
        </div>

        {/* Top actions deck (if editable) */}
        {isEditable && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditOpen(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              <FaEdit /> Edit Claim
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              <FaTrash /> Delete Claim
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Details & Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side (Spans 2 cols): Claim Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-[var(--border-color)] space-y-6 shadow-sm">
            {/* Submitter Info Card (Only for manager/admin viewing others' claims) */}
            {expense.user_id !== user?.id && (
              <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
                  {expense.employee_name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <span className="text-3xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block">Submitted By</span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">{expense.employee_name || "Unknown Claimant"}</span>
                  <span className="text-2xs text-[var(--text-secondary)] block font-medium mt-0.5">{expense.employee_email || "No email available"}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-start pb-4 border-b border-[var(--border-color)]/60">
              <div className="space-y-1">
                <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider block">
                  Category: <span className="text-[var(--text-primary)] font-bold">{formatCategory(expense.category)}</span>
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1.5">
                  Task: {expense.task_title || <span className="text-gray-400 italic">General Claim</span>}
                </h3>
              </div>
              <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-right">
                <span className="text-3xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block">Reimbursement Value</span>
                <span className="text-2xl font-black text-[var(--text-primary)] mt-0.5 block">
                  ₹{parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Description Block */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Reason / Description</h4>
              <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-tertiary)] p-5 rounded-xl border border-[var(--border-color)] leading-relaxed whitespace-pre-wrap">
                {expense.description || "No specific details were logged for this claim request."}
              </p>
            </div>

            {/* Receipt Download Block */}
            {expense.attachment_name && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-700 min-w-0 flex-1 pr-4">
                  <FaReceipt className="text-blue-500 text-xl flex-shrink-0" />
                  <span className="truncate">{expense.attachment_name}</span>
                </div>
                <button
                  onClick={() => {
                    const fileUrl = `${backendBaseUrl}/uploads/expenses/${expense.attachment_name}`;
                    handleSafeDownload(fileUrl);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded-lg text-xs font-bold border border-gray-150 transition-colors cursor-pointer focus:outline-none"
                >
                  <FaFileDownload /> View Receipt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side (Spans 1 col): Stepper Timeline */}
        <div className="glass-panel p-6 rounded-2xl border border-[var(--border-color)] space-y-6 shadow-sm">
          <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Workflow Routing Status</h4>
          
          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border-color)]">
            
            {/* Step 1: Submitted — always shown */}
            <div className="relative">
              <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white">✓</span>
              <div>
                <h5 className="text-sm font-bold text-[var(--text-primary)]">Claim Submitted</h5>
                <p className="text-3xs text-[var(--text-secondary)] font-medium mt-0.5 flex items-center gap-1">
                  <FaCalendarAlt /> {new Date(expense.expense_date || expense.created_at).toLocaleDateString()}
                </p>
                <p className="text-2xs text-[var(--text-secondary)] mt-1.5 font-sans leading-normal">
                  Filed against assigned task.
                </p>
              </div>
            </div>

            {/* Step 2: Manager Review — only for EMPLOYEE, not for MANAGER's own expense */}
            {!isManagerExpense && (
              <div className="relative">
                {isManagerApproved ? (
                  <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white">✓</span>
                ) : isManagerRejected ? (
                  <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[8px] text-white">✗</span>
                ) : (
                  <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[8px] text-white animate-pulse">⏰</span>
                )}
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-[var(--text-primary)] flex justify-between items-center gap-2">
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
                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-2xs text-rose-600 flex gap-1">
                      <FaExclamationCircle className="flex-shrink-0 mt-0.5" />
                      <span>Reason: {expense.rejection_reason}</span>
                    </div>
                  )}
                  {!isManagerReviewed && (
                    <p className="text-2xs text-[var(--text-secondary)] mt-1 font-sans leading-normal">
                      Awaiting initial sign-off from operational manager.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Admin Review */}
            <div className="relative">
              {isAdminApproved ? (
                <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white">✓</span>
              ) : isAdminRejected ? (
                <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[8px] text-white">✗</span>
              ) : (
                <span className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px]" />
              )}
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-[var(--text-primary)] flex justify-between items-center gap-2">
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
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-2xs text-rose-600 flex gap-1">
                    <FaExclamationCircle className="flex-shrink-0 mt-0.5" />
                    <span>Reason: {expense.rejection_reason}</span>
                  </div>
                )}
                {!isAdminReviewed && (
                  <p className="text-2xs text-[var(--text-secondary)] mt-1 font-sans leading-normal">
                    Final corporate disbursement and budget settlement audit.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Edit Form Modal */}
      {isEditOpen && (
        <ExpenseModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleEditSubmit}
          loading={updateMutation.isPending}
          initialData={expense}
        />
      )}

      {/* Confirm Delete Dialog */}
      {isDeleteOpen && (
        <ConfirmDialog
          title="Delete Claim"
          description="Are you sure you want to permanently delete this pending claim? This action cannot be undone."
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate(expense.id)}
        />
      )}
    </div>
  );
}

export default ExpenseDetailsPage;
