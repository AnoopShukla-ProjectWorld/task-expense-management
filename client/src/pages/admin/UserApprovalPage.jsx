import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaSearch,
  FaFilter,
  FaCheck,
  FaTimes,
  FaBan,
  FaClock,
  FaUserShield,
  FaUserTie,
  FaUser,
  FaCalendarAlt,
  FaSpinner,
  FaInfoCircle
} from "react-icons/fa";
import { getUsers, approveUser, rejectUser, suspendUser } from "../../services/userService";

const UserApprovalPage = () => {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Approval modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignedRole, setAssignedRole] = useState("employee");

  // Fetch pending/rejected/suspended users
  const { data: users, isLoading } = useQuery({
    queryKey: ["users-onboarding", search, statusFilter],
    queryFn: async () => {
      // getUsers expects page, limit, search, role, status. We filter by status
      const response = await getUsers({
        search,
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 100
      });
      // Filter out any admin users from onboarding list
      return (response || []).filter(u => u.role?.toLowerCase() !== "admin");
    }
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["users-onboarding"]);
      queryClient.invalidateQueries(["users"]);
      setSelectedUser(null);
      toast.success(data.message || "User approved and role assigned!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to approve user.");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: rejectUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["users-onboarding"]);
      queryClient.invalidateQueries(["users"]);
      toast.success("User onboarding application rejected.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to reject user.");
    }
  });

  const suspendMutation = useMutation({
    mutationFn: suspendUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["users-onboarding"]);
      queryClient.invalidateQueries(["users"]);
      toast.success("User account suspended successfully.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to suspend user.");
    }
  });

  const calculateAge = (dobString) => {
    if (!dobString) return "N/A";
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/25";
      case "rejected":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/25";
      case "suspended":
        return "bg-orange-500/10 text-orange-500 border border-orange-500/25";
      case "approved":
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/25";
      default:
        return "bg-slate-500/10 text-slate-500 border border-slate-500/25";
    }
  };

  // Get total counts for metrics card
  const pendingCount = users?.filter(u => u.status === "pending")?.length || 0;
  const suspendedCount = users?.filter(u => u.status === "suspended")?.length || 0;
  const rejectedCount = users?.filter(u => u.status === "rejected")?.length || 0;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Onboarding Approvals</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Review registration requests, verify credentials, and allocate corporate roles</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Pending Card */}
        <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-lg">
            <FaClock />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Pending Approvals</p>
            <h3 className="text-2xl font-bold mt-0.5 text-[var(--text-primary)]">{pendingCount}</h3>
          </div>
        </div>

        {/* Suspended Card */}
        <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center text-lg">
            <FaBan />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Suspended Accounts</p>
            <h3 className="text-2xl font-bold mt-0.5 text-[var(--text-primary)]">{suspendedCount}</h3>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center text-lg">
            <FaTimes />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Rejected Requests</p>
            <h3 className="text-2xl font-bold mt-0.5 text-[var(--text-primary)]">{rejectedCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--text-secondary)]">
            <FaSearch className="text-sm" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-350 dark:hover:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { label: "Pending Review", value: "pending" },
            { label: "Rejected Only", value: "rejected" },
            { label: "Suspended Only", value: "suspended" },
            { label: "All Applicants", value: "all" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                statusFilter === tab.value
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold"
                  : "bg-transparent border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[var(--text-secondary)] gap-3">
            <FaSpinner className="animate-spin text-3xl text-blue-500" />
            <span className="text-sm font-semibold uppercase tracking-wider">Retrieving Onboarding Ledger...</span>
          </div>
        ) : !users || users.length === 0 ? (
          <div className="py-20 text-center text-[var(--text-secondary)] space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-2">
              <FaInfoCircle className="text-xl" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">No registration records found</h4>
            <p className="text-xs">There are no records matching your current filter selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider select-none">
                  <th className="py-4 px-6">Applicant Name</th>
                  <th className="py-4 px-6">Email / Mobile</th>
                  <th className="py-4 px-6">Gender / Age</th>
                  <th className="py-4 px-6">Registration Date</th>
                  <th className="py-4 px-6">Status Badge</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {users.map((row) => (
                  <motion.tr 
                    key={row.id}
                    className="hover:bg-[var(--bg-hover)]/30 transition-colors duration-150 text-sm"
                  >
                    {/* Name */}
                    <td className="py-4.5 px-6 font-semibold text-[var(--text-primary)]">
                      {row.full_name}
                    </td>

                    {/* Email/Mobile */}
                    <td className="py-4.5 px-6 space-y-0.5">
                      <div className="text-[var(--text-primary)] font-medium">{row.email}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{row.mobile_number || "N/A"}</div>
                    </td>

                    {/* Age / Gender */}
                    <td className="py-4.5 px-6 space-y-0.5">
                      <div className="font-semibold text-[var(--text-primary)]">{row.gender}</div>
                      <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                        <FaCalendarAlt className="text-[10px]" /> Age: {calculateAge(row.date_of_birth)}
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td className="py-4.5 px-6 text-xs text-[var(--text-secondary)] font-medium">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      }) : "N/A"}
                    </td>

                    {/* Status badge */}
                    <td className="py-4.5 px-6">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold tracking-wider uppercase ${getStatusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4.5 px-6 text-right">
                      <div className="flex gap-2 justify-end">
                        {row.status === "pending" && (
                          <>
                            <button
                              onClick={() => setSelectedUser(row)}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <FaCheck /> Approve
                            </button>
                            <button
                              disabled={rejectMutation.isPending}
                              onClick={() => {
                                if(confirm("Are you sure you want to reject this applicant?")) {
                                  rejectMutation.mutate(row.id);
                                }
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <FaTimes /> Reject
                            </button>
                          </>
                        )}

                        {row.status === "approved" && (
                          <button
                            disabled={suspendMutation.isPending}
                            onClick={() => {
                              if(confirm("Are you sure you want to suspend this user account?")) {
                                suspendMutation.mutate(row.id);
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <FaBan /> Suspend
                          </button>
                        )}

                        {(row.status === "suspended" || row.status === "rejected") && (
                          <button
                            onClick={() => setSelectedUser(row)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                          >
                            Re-Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPROVAL MODAL - ROLE ASSIGNMENT */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative z-10"
            >
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                Assign Corporate Role
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-6">
                Provision platform authorization and security clearance for <strong>{selectedUser.full_name}</strong>:
              </p>

              <div className="space-y-4 mb-8">
                
                {/* Employee Role Option */}
                <div 
                  onClick={() => setAssignedRole("employee")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                    assignedRole === "employee" 
                      ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400" 
                      : "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 text-lg">
                    <FaUser />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Employee Account</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Submit expenses, complete assigned tasks, and update personal profile</p>
                  </div>
                </div>

                {/* Manager Role Option */}
                <div 
                  onClick={() => setAssignedRole("manager")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                    assignedRole === "manager" 
                      ? "bg-violet-500/10 border-violet-500/40 text-violet-600 dark:text-violet-400" 
                      : "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 text-lg">
                    <FaUserTie />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Manager Account</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Allocate project budgets, approve employee expenses, and coordinate team tasks</p>
                  </div>
                </div>

              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-sm font-semibold transition-colors cursor-pointer text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  disabled={approveMutation.isPending}
                  onClick={() => {
                    approveMutation.mutate({ id: selectedUser.id, role: assignedRole });
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  {approveMutation.isPending ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <>
                      <FaCheck /> Confirm Activation
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UserApprovalPage;
