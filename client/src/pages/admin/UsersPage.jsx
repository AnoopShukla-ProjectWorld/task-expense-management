import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getUsers, createUser, updateUser, deleteUser } from "../../services/userService";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import UserModal from "../../components/modals/UserModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Button from "../../components/common/Button";

function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => getUsers({ search, limit: 10000 }),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setIsModalOpen(false);
      toast.success("User created successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setIsModalOpen(false);
      setEditingUser(null);
      toast.success("User updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setDeleteId(null);
      toast.success("User deleted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete user");
    },
  });

  const handleSubmit = (data) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { key: "full_name", title: "Name" },
    { key: "email", title: "Email" },
    { key: "employee_id", title: "Emp ID" },
    { key: "mobile_number", title: "Mobile" },
    {
      key: "role",
      title: "Role",
      render: (row) => (
        <span className={`inline-flex justify-center items-center w-24 px-2.5 py-1 rounded-xl text-xs font-bold tracking-wide uppercase border text-center shadow-sm ${
          row.role === "admin"
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
            : row.role === "manager"
            ? "bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.05)]"
            : "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]"
        }`}>
          {row.role}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <span className={`inline-flex justify-center items-center w-24 px-2.5 py-1 rounded-xl text-xs font-bold tracking-wide uppercase border text-center shadow-sm ${
          row.status === "approved" || row.status === "ACTIVE" || !row.status
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
            : row.status === "pending"
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }`}>
          {row.status || "approved"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => {
        const isAdmin = row.role?.toLowerCase() === "admin";
        return (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingUser(row);
                setIsModalOpen(true);
              }}
              disabled={isAdmin}
              className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition-all shadow-sm ${
                isAdmin
                  ? "bg-slate-100/5 border-slate-200/5 text-slate-500 cursor-not-allowed opacity-40"
                  : "bg-blue-600/10 border-blue-500/30 hover:bg-blue-600 text-blue-600 hover:text-white cursor-pointer"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setDeleteId(row.id)}
              disabled={isAdmin}
              className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition-all shadow-sm ${
                isAdmin
                  ? "bg-slate-100/5 border-slate-200/5 text-slate-500 cursor-not-allowed opacity-40"
                  : "bg-rose-600/10 border-rose-500/30 hover:bg-rose-600 text-rose-600 hover:text-white cursor-pointer"
              }`}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Users Management</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Manage and provision team profiles and permissions</p>
        </div>
        <Button onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
          Create User
        </Button>
      </div>

      <TableSearch
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <DataTable
        columns={columns}
        data={users || []}
        loading={isLoading}
        actions={false}
      />

      <UserModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        initialData={editingUser}
      />

      {deleteId && (
        <ConfirmDialog
          title="Delete User"
          description="Are you sure? This action will permanently revoke this user's platform access and credentials."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => deleteMutation.mutate(deleteId)}
        />
      )}
    </div>
  );
}

export default UsersPage;