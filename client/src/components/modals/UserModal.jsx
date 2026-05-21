import { useEffect } from "react";
import { useForm } from "react-hook-form";

function UserModal({ isOpen, onClose, onSubmit, loading, initialData }) {
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (initialData) {
      reset({
        full_name: initialData.full_name,
        email: initialData.email,
        employee_id: initialData.employee_id,
        phone_number: initialData.phone_number || "",
        role_id: initialData.role_id,
      });
    } else {
      reset({
        full_name: "",
        email: "",
        employee_id: "",
        phone_number: "",
        password: "",
        role_id: "",
      });
    }
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  // role_id ko integer me convert karke submit karo
  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      role_id: parseInt(data.role_id),
      department_id: data.department_id
        ? parseInt(data.department_id)
        : undefined,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <h2 className="text-xl font-bold mb-5">
          {initialData ? "Edit User" : "Create User"}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Full Name *</label>
            <input
              type="text"
              placeholder="Enter full name"
              {...register("full_name")}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              placeholder="Enter email"
              {...register("email")}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Employee ID *</label>
            <input
              type="text"
              placeholder="e.g. EMP001"
              {...register("employee_id")}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="text"
              placeholder="Enter phone number"
              {...register("phone_number")}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!initialData && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Password * (min 8 chars)</label>
              <input
                type="password"
                placeholder="Enter password"
                {...register("password")}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Role *</label>
            <select
              {...register("role_id")}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Role</option>
              <option value="1">Admin</option>
              <option value="2">Manager</option>
              <option value="3">Employee</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default UserModal;