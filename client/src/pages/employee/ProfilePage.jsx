import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getProfile, updateProfile } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";
import { FaUser, FaEnvelope, FaIdCard, FaBuilding, FaUserTag, FaPhoneAlt } from "react-icons/fa";

function ProfilePage() {
  const queryClient = useQueryClient();
  const { user: authUser, login } = useAuth();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch logged-in user profile details
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || "",
        phone_number: profile.phone_number || "",
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries(["profile"]);
      toast.success("Profile updated successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to save profile changes");
    },
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-gray-500">Manage your contact information and view corporate credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 flex flex-col items-center text-center shadow-sm h-fit">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-md mb-4 uppercase">
            {profile?.full_name ? profile.full_name.charAt(0) : "U"}
          </div>
          <h3 className="text-lg font-bold text-gray-800 tracking-tight">{profile?.full_name}</h3>
          <p className="text-xs text-blue-500 font-bold uppercase tracking-wider mt-0.5">{profile?.role_name || "EMPLOYEE"}</p>
          
          <div className="w-full border-t border-gray-100 mt-6 pt-5 space-y-3.5 text-left text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <FaIdCard className="text-gray-400 text-base" />
              <div>
                <span className="text-3xs font-semibold text-gray-400 block uppercase">Employee ID</span>
                <span className="font-bold text-gray-800">{profile?.employee_id || "—"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaBuilding className="text-gray-400 text-base" />
              <div>
                <span className="text-3xs font-semibold text-gray-400 block uppercase">Department</span>
                <span className="font-bold text-gray-800">{profile?.department_name || "Unassigned"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 lg:col-span-2 shadow-sm">
          <h4 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3.5 mb-5">Personal Information</h4>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Full Name *</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    {...register("full_name", { required: "Full name is required" })}
                    className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800"
                  />
                </div>
                {errors.full_name && (
                  <p className="text-xs text-red-500 font-medium">{errors.full_name.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Phone Number</label>
                <div className="relative">
                  <FaPhoneAlt className="absolute left-4 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    {...register("phone_number")}
                    placeholder="Enter phone number"
                    className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="flex flex-col gap-1 bg-gray-50 border border-gray-100/50 rounded-xl p-3.5">
                <span className="text-3xs font-semibold text-gray-400 uppercase flex items-center gap-1.5 mb-1">
                  <FaEnvelope className="text-gray-400" /> Email Address
                </span>
                <span className="text-sm font-bold text-gray-700 select-all">{profile?.email}</span>
              </div>

              <div className="flex flex-col gap-1 bg-gray-50 border border-gray-100/50 rounded-xl p-3.5">
                <span className="text-3xs font-semibold text-gray-400 uppercase flex items-center gap-1.5 mb-1">
                  <FaUserTag className="text-gray-400" /> Account Status
                </span>
                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  {profile?.status || "ACTIVE"}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2.5 font-bold shadow-md shadow-blue-500/10"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;