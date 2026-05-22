import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../../services/expenseService";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/tables/DataTable";
import ExpenseModal from "../../components/modals/ExpenseModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import { FaFileDownload, FaPlus, FaReceipt } from "react-icons/fa";

function MyExpensesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Fetch all expenses
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: getExpenses,
  });

  // Filter expenses submitted by this employee
  const myExpenses = expenses?.filter((e) => e.user_id === user?.id) || [];

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      setIsModalOpen(false);
      toast.success("Expense submitted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit expense");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      setIsModalOpen(false);
      setEditingExpense(null);
      toast.success("Expense updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update expense");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      setDeleteId(null);
      toast.success("Expense deleted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete expense");
    },
  });

  const handleSubmit = (formData) => {
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
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
      key: "project_name",
      title: "Project",
      render: (row) => row.project_name || <span className="text-gray-400 italic">General / None</span>,
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
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border ${
            row.status === "APPROVED"
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : row.status === "REJECTED"
              ? "bg-red-100 text-red-800 border-red-200"
              : "bg-amber-100 text-amber-800 border-amber-200"
          }`}>
            {row.status}
          </span>
          {row.status === "REJECTED" && row.rejection_reason && (
            <span className="text-3xs text-red-500 font-medium italic truncate max-w-xs" title={row.rejection_reason}>
              Reason: {row.rejection_reason}
            </span>
          )}
        </div>
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
            <FaFileDownload /> View Receipt
          </a>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => {
        // Can only modify/delete PENDING expense claims
        if (row.status !== "PENDING") {
          return <span className="text-xs text-gray-400 font-semibold italic">Claim Locked</span>;
        }
        return (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditingExpense(row); setIsModalOpen(true); }}
              className="px-2.5 py-1 bg-blue-500 hover:bg-blue-650 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setDeleteId(row.id)}
              className="px-2.5 py-1 bg-red-500 hover:bg-red-650 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Expense Claims</h1>
          <p className="text-gray-500">File and track reimbursements for business expenditures</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); setIsModalOpen(true); }} className="flex items-center gap-2">
          <FaPlus /> Submit Expense
        </Button>
      </div>

      {myExpenses.length === 0 ? (
        <div className="space-y-6">
          <EmptyState
            title="No Expenses Filed"
            description="You haven't filed any travel, food, or supply reimbursement requests yet. Click 'Submit Expense' to create one."
          />
          <ExpenseModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
            onSubmit={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
            initialData={editingExpense}
          />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={myExpenses}
            loading={isLoading}
            actions={false}
          />

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
              description="Are you sure you want to delete this pending claim? This action will permanently remove it from auditing records."
              onCancel={() => setDeleteId(null)}
              onConfirm={() => deleteMutation.mutate(deleteId)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default MyExpensesPage;
