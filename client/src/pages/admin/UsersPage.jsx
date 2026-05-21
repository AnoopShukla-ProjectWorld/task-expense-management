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
    queryFn: () => getUsers(search),
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
    { key: "role_name", title: "Role" },
    { key: "status", title: "Status" },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingUser(row); setIsModalOpen(true); }}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-gray-500">Manage all system users</p>
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
          description="Are you sure? This action cannot be undone."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => deleteMutation.mutate(deleteId)}
        />
      )}
    </div>
  );
}

export default UsersPage;