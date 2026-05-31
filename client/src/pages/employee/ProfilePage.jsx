import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getProfile, updateProfile } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";
import { FaUser, FaEnvelope, FaIdCard, FaBuilding, FaUserTag, FaPhoneAlt, FaCamera } from "react-icons/fa";

function ProfilePage() {
  const queryClient = useQueryClient();
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const parsePhone = (phoneStr) => {
    if (!phoneStr) return { countryCode: "+91", localNumber: "" };
    if (phoneStr.startsWith("+91")) return { countryCode: "+91", localNumber: phoneStr.slice(3) };
    if (phoneStr.startsWith("+1")) return { countryCode: "+1", localNumber: phoneStr.slice(2) };
    if (phoneStr.startsWith("+44")) return { countryCode: "+44", localNumber: phoneStr.slice(3) };
    if (phoneStr.startsWith("+971")) return { countryCode: "+971", localNumber: phoneStr.slice(4) };
    return { countryCode: "+91", localNumber: phoneStr };
  };

  // Fetch logged-in user profile details
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  useEffect(() => {
    if (profile) {
      const parsed = parsePhone(profile.phone_number || profile.mobile_number);
      reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone_country: parsed.countryCode,
        phone_local: parsed.localNumber,
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries(["profile"]);
      if (updatedUser) {
        setAuthUser({
          ...updatedUser,
          role: updatedUser.role?.toUpperCase(),
          fullName: updatedUser.full_name || updatedUser.fullName || "",
        });
      }
      setAvatarFile(null);
      toast.success("Profile updated successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to save profile changes");
    },
  });

  const onSubmit = (data) => {
    const { phone_country, phone_local, ...rest } = data;
    const combinedPhone = phone_local ? `${phone_country}${phone_local}` : "";
    
    const formData = new FormData();
    formData.append("first_name", data.first_name);
    formData.append("last_name", data.last_name);
    formData.append("phone_number", combinedPhone);
    if (avatarFile) {
      formData.append("profile_image", avatarFile);
    }
    
    updateMutation.mutate(formData);
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
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
          My Profile
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Manage your contact information and view corporate credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col items-center text-center shadow-lg h-fit">
          {/* Profile Picture Uploader */}
          <div className="relative group mb-4 cursor-pointer">
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  const file = files[0];
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Avatar image must be under 5MB");
                    return;
                  }
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }
              }}
              id="avatar-upload-input"
              className="hidden"
            />
            <label htmlFor="avatar-upload-input" className="cursor-pointer block relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-20 h-20 rounded-full object-cover border border-[var(--border-color)] shadow-md"
                />
              ) : profile?.profile_image ? (
                <img
                  src={`http://localhost:5000${profile.profile_image}`}
                  alt={profile.full_name}
                  className="w-20 h-20 rounded-full object-cover border border-[var(--border-color)] shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--accent-blue)] to-[var(--accent-purple)] text-white flex items-center justify-center text-3xl font-extrabold shadow-md uppercase">
                  {profile?.full_name ? profile.full_name.charAt(0) : "U"}
                </div>
              )}
              {/* Camera Hover Overlay */}
              <div className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200">
                <FaCamera className="text-lg" />
              </div>
            </label>
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">{profile?.full_name}</h3>
          <p className="text-xs text-[var(--accent-blue)] font-bold uppercase tracking-wider mt-0.5">{profile?.role || "EMPLOYEE"}</p>
          
          <div className="w-full border-t border-[var(--border-color)] mt-6 pt-5 space-y-3.5 text-left text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-3">
              <FaIdCard className="text-[var(--text-secondary)]/70 text-base" />
              <div>
                <span className="text-3xs font-semibold text-[var(--text-secondary)]/70 block uppercase">Employee ID</span>
                <span className="font-bold text-[var(--text-primary)]">{profile?.employee_id || "—"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaBuilding className="text-[var(--text-secondary)]/70 text-base" />
              <div>
                <span className="text-3xs font-semibold text-[var(--text-secondary)]/70 block uppercase">Department</span>
                <span className="font-bold text-[var(--text-primary)]">{profile?.department_name || "Unassigned"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 shadow-lg">
          <h4 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3.5 mb-5">Personal Information</h4>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">First Name *</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-3.5 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    autoComplete="off"
                    {...register("first_name", {
                      required: "First name is required",
                      pattern: {
                        value: /^[a-zA-Z\s'-]+$/,
                        message: "First name can only contain letters, spaces, hyphens, and apostrophes",
                      },
                    })}
                    className="w-full rounded-xl border border-[var(--border-color)] pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50 text-sm font-semibold bg-[var(--bg-primary)]/40 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:bg-white/[0.03] transition-all"
                  />
                </div>
                {errors.first_name && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">{errors.first_name.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Last Name *</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-3.5 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    autoComplete="off"
                    {...register("last_name", {
                      required: "Last name is required",
                      pattern: {
                        value: /^[a-zA-Z\s'-]+$/,
                        message: "Last name can only contain letters, spaces, hyphens, and apostrophes",
                      },
                    })}
                    className="w-full rounded-xl border border-[var(--border-color)] pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50 text-sm font-semibold bg-[var(--bg-primary)]/40 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:bg-white/[0.03] transition-all"
                  />
                </div>
                {errors.last_name && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">{errors.last_name.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Phone Number</label>
                <div className="flex gap-2">
                  <div className="relative w-[90px] shrink-0">
                    <select
                      {...register("phone_country")}
                      className="w-full pl-2 pr-6 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50 cursor-pointer appearance-none"
                    >
                      <option value="+91" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">🇮🇳 +91</option>
                      <option value="+1" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">🇺🇸 +1</option>
                      <option value="+44" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">🇬🇧 +44</option>
                      <option value="+971" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">🇦🇪 +971</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-[var(--text-secondary)]">
                      <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>

                  <div className="relative flex-1 group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--text-secondary)] group-focus-within:text-[var(--accent-blue)] transition-colors">
                      <FaPhoneAlt className="text-xs" />
                    </span>
                    <input
                      type="text"
                      placeholder="9999999999"
                      autoComplete="off"
                      {...register("phone_local", {
                        validate: (val) => {
                          if (!val) return true; // Optional field
                          if (/[^0-9]/.test(val)) return "Phone number must contain only digits";
                          
                          const country = watch("phone_country");
                          if (country === "+91") {
                            return /^[6-9]\d{9}$/.test(val) || "India number must be 10 digits starting 6-9";
                          }
                          if (country === "+1") {
                            return /^\d{10}$/.test(val) || "USA/Canada number must be 10 digits";
                          }
                          if (country === "+44") {
                            return /^7\d{9}$/.test(val) || "UK number must be 10 digits starting with 7";
                          }
                          if (country === "+971") {
                            return /^5\d{8}$/.test(val) || "UAE number must be 9 digits starting with 5";
                          }
                          return true;
                        }
                      })}
                      className="w-full rounded-xl border border-[var(--border-color)] pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50 text-sm font-semibold bg-[var(--bg-primary)]/40 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:bg-white/[0.03] transition-all"
                    />
                  </div>
                </div>
                {errors.phone_local && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">{errors.phone_local.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="flex flex-col gap-1 bg-[var(--bg-primary)]/40 border border-[var(--border-color)] rounded-xl p-3.5">
                <span className="text-3xs font-semibold text-[var(--text-secondary)] uppercase flex items-center gap-1.5 mb-1">
                  <FaEnvelope className="text-[var(--text-secondary)]" /> Email Address
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)] select-all">{profile?.email}</span>
              </div>

              <div className="flex flex-col gap-1 bg-[var(--bg-primary)]/40 border border-[var(--border-color)] rounded-xl p-3.5">
                <span className="text-3xs font-semibold text-[var(--text-secondary)] uppercase flex items-center gap-1.5 mb-1">
                  <FaUserTag className="text-[var(--text-secondary)]" /> Account Status
                </span>
                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  {profile?.status || "ACTIVE"}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--border-color)] mt-6">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2.5 font-bold shadow-md shadow-[var(--accent-blue)]/10"
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