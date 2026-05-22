import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaDollarSign, FaTags, FaCalendarAlt, FaInfoCircle, FaProjectDiagram, FaPaperclip } from "react-icons/fa";
import { getProjects } from "../../services/projectService";
import FileUpload from "../common/FileUpload";

function ExpenseModal({ isOpen, onClose, onSubmit, loading, initialData }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [receiptFile, setReceiptFile] = useState(null);

  // Fetch projects to link expenses to them if needed
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setReceiptFile(null);
      if (initialData) {
        const expenseDate = initialData.expense_date
          ? new Date(initialData.expense_date).toISOString().split("T")[0]
          : "";

        reset({
          amount: initialData.amount || "",
          category: initialData.category || "TRAVEL",
          expense_date: expenseDate,
          description: initialData.description || "",
          project_id: initialData.project_id || "",
        });
      } else {
        reset({
          amount: "",
          category: "TRAVEL",
          expense_date: "",
          description: "",
          project_id: "",
        });
      }
    }
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  const handleFileDrop = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setReceiptFile(acceptedFiles[0]);
    }
  };

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    formData.append("amount", parseFloat(data.amount));
    formData.append("category", data.category);
    formData.append("expense_date", data.expense_date);
    if (data.description) {
      formData.append("description", data.description);
    }
    if (data.project_id) {
      formData.append("project_id", parseInt(data.project_id));
    }
    if (receiptFile) {
      formData.append("receipt", receiptFile);
    }
    onSubmit(formData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-955/65 backdrop-blur-md cursor-pointer"
        />

        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-lg glass-panel rounded-3xl p-6.5 border border-white/10 shadow-2xl relative overflow-hidden z-10 my-8"
        >
          {/* Decorative background ambient lighting */}
          <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center mb-6 relative">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {initialData ? "Modify Expense Entry" : "File Expense Claim"}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">Report receipts, amounts, categories, and client billing</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 scrollbar-thin relative">
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Amount (₹) *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-emerald-400 transition-colors font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  required
                  {...register("amount", {
                    required: "Expense amount is required",
                    min: { value: 1, message: "Amount must be at least ₹1" }
                  })}
                  onKeyPress={(e) => {
                    if (/[^0-9.]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:bg-white/[0.07] transition-all"
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-rose-400 font-bold mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Category *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <FaTags className="text-sm" />
                  </span>
                  <select
                    required
                    {...register("category", { required: "Category is required" })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all"
                  >
                    <option value="TRAVEL" className="bg-slate-950 text-slate-200">Travel</option>
                    <option value="FOOD" className="bg-slate-950 text-slate-200">Food</option>
                    <option value="ACCOMMODATION" className="bg-slate-950 text-slate-200">Accommodation</option>
                    <option value="OFFICE_SUPPLIES" className="bg-slate-950 text-slate-200">Office Supplies</option>
                    <option value="MISCELLANEOUS" className="bg-slate-950 text-slate-200">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Expense Date *</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <FaCalendarAlt className="text-sm" />
                  </span>
                  <input
                    type="date"
                    required
                    {...register("expense_date", { required: "Date is required" })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
                {errors.expense_date && (
                  <p className="text-xs text-rose-400 font-bold mt-1">{errors.expense_date.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Reason / Description</label>
              <div className="relative group">
                <span className="absolute top-3 left-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                  <FaInfoCircle className="text-sm" />
                </span>
                <textarea
                  rows={2}
                  placeholder="Outline client details, business targets, or purchase contexts..."
                  {...register("description")}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:bg-white/[0.07] transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Link Project (Optional)</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                  <FaProjectDiagram className="text-sm" />
                </span>
                <select
                  {...register("project_id")}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all"
                >
                  <option value="" className="bg-slate-950 text-slate-400">General Expense (No Project)</option>
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200">
                      {p.project_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Receipt Attachment</label>
              <FileUpload onDrop={handleFileDrop} selectedFile={receiptFile} />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl text-xs transition-colors disabled:opacity-50 cursor-pointer text-glow shadow-md shadow-emerald-500/20"
              >
                {loading ? "Filing..." : initialData ? "Modify Claim" : "File Claim"}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ExpenseModal;
