import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../../services/expenseService";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/tables/DataTable";
import ExpenseModal from "../../components/modals/ExpenseModal";
import ExpenseDetailsModal from "../../components/modals/ExpenseDetailsModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import { FaFileDownload, FaReceipt, FaEye, FaSearch } from "react-icons/fa";
import { handleSafeDownload } from "../../utils/fileUtils";
import { AnimatePresence } from "framer-motion";
import TableSearch from "../../components/tables/TableSearch";

function MyExpensesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch personal expenses
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses", { my: true }],
    queryFn: () => getExpenses({ my: true }),
  });

  // Filter expenses submitted by this employee
  const myExpenses = expenses?.filter((e) => e.user_id === user?.id) || [];

  const filteredExpenses = myExpenses.filter((expense) => {
    const query = searchQuery.toLowerCase();
    const taskTitle = expense.task_title || "General / Unlinked";
    const amountStr = expense.amount ? `₹${parseFloat(expense.amount).toFixed(2)}` : "";
    
    // Status text mapping matching columns
    let statusText = "Awaiting Mgr";
    if (expense.status === "APPROVED") {
      statusText = "Approved";
    } else if (expense.status === "REJECTED") {
      statusText = "Rejected";
    } else if (expense.manager_approval === "APPROVED") {
      statusText = "Awaiting Admin";
    }

    return (
      expense.category?.toLowerCase().includes(query) ||
      expense.description?.toLowerCase().includes(query) ||
      taskTitle.toLowerCase().includes(query) ||
      expense.amount?.toString().includes(query) ||
      amountStr.toLowerCase().includes(query) ||
      statusText.toLowerCase().includes(query) ||
      (expense.expense_date ? new Date(expense.expense_date).toLocaleDateString().includes(query) : false)
    );
  });

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
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
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
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
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
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

  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "");

  const columns = [
    {
      key: "expense_date",
      title: "Date",
      render: (row) => (row.expense_date ? new Date(row.expense_date).toLocaleDateString() : "—"),
    },
    {
      key: "task_title",
      title: "Assigned Task",
      render: (row) => row.task_title || <span className="text-gray-400 italic">General / Unlinked</span>,
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
      render: (row) => {
        let badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
        let text = "Awaiting Mgr";

        if (row.status === "APPROVED") {
          badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
          text = "Approved";
        } else if (row.status === "REJECTED") {
          badgeClass = "bg-red-50 text-red-700 border-red-200";
          text = "Rejected";
        } else if (row.manager_approval === "APPROVED") {
          badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
          text = "Awaiting Admin";
        }

        return (
          <div className="flex flex-col gap-0.5">
            <span className={`inline-flex justify-center items-center w-32 px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase border ${badgeClass} whitespace-nowrap text-center`}>
              {text}
            </span>
          </div>
        );
      },
    },
    {
      key: "receipt",
      title: "Receipt",
      render: (row) => {
        if (!row.attachment_name) return <span className="text-xs text-gray-400 italic">No receipt</span>;
        const fileUrl = `${backendBaseUrl}/uploads/expenses/${row.attachment_name}`;
        return (
          <button
            onClick={() => handleSafeDownload(fileUrl)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded-lg text-xs font-bold border border-gray-150 transition-colors cursor-pointer focus:outline-none"
          >
            <FaFileDownload /> View Receipt
          </button>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => {
        const rolePath = user?.role === "MANAGER" ? "manager/my-expenses" : "employee/expenses";
        return (
          <button
            onClick={() => navigate(`/${rolePath}/${row.id}`)}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
          >
            <FaEye className="text-[10px]" /> Timeline
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Task Expense Claims</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">File and track reimbursements for task expenditures</p>
        </div>

        {/* Search Field */}
        <TableSearch
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search expenses..."
        />
      </div>

      {myExpenses.length === 0 ? (
        <div className="space-y-6">
          <EmptyState
            title="No Expenses Filed"
            description="You haven't filed any hardware, software licensing, or operational reimbursement requests yet. You can submit new claims directly from your tasks on the My Tasks page."
          />
          <ExpenseModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
            onSubmit={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
            initialData={editingExpense}
          />
        </div>
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          title="No Matching Expenses"
          description="No expenses match your search query. Try typing another category, description, or task name."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={filteredExpenses}
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
