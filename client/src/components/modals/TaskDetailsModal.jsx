import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaComment, FaPaperPlane, FaUser, FaClock, FaCalendarAlt, FaStar } from "react-icons/fa";
import { getTaskComments, createTaskComment } from "../../services/taskService";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// Helper to format comment time beautifully
const formatCommentTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }) + " • " + date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });
};

function TaskDetailsModal({ task, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  // Live Comments Fetching
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["taskComments", task.id],
    queryFn: () => getTaskComments(task.id),
    enabled: !!task?.id
  });

  // Mutation to add comment
  const commentMutation = useMutation({
    mutationFn: (commentText) => createTaskComment(task.id, commentText),
    onSuccess: () => {
      queryClient.invalidateQueries(["taskComments", task.id]);
      setNewComment("");
      toast.success("Comment posted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to post comment");
    }
  });

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment.trim());
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "HIGH": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "MEDIUM": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="glass-panel bg-[var(--bg-secondary)] border border-white/10 w-full max-w-2xl rounded-2xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start p-6 border-b border-white/5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                {task.priority} Priority
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-semibold">
                Project: {task.project_name || "Internal"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] leading-snug">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Description Block */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Assignment Scope</h4>
            <p className="text-sm text-[var(--text-primary)] bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed">
              {task.description || "No specific details were logged for this assignment."}
            </p>
          </div>

          {/* Workflow Metas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
              <FaCalendarAlt className="text-indigo-400 text-lg" />
              <div>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Deadline</p>
                <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString("en-IN") : "No Due Date"}
                </p>
              </div>
            </div>
            <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
              <FaStar className="text-emerald-400 text-lg animate-pulse" />
              <div>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Milestone Status</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5 uppercase tracking-wide">
                  {task.status?.replace("_", " ")}
                </p>
              </div>
            </div>
            <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
              <div className="w-full">
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase mb-1 flex justify-between">
                  <span>Progress</span>
                  <span className="text-blue-400 font-bold">{task.completion_percentage}%</span>
                </p>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${task.completion_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Discussion comments area */}
          <div className="border-t border-white/5 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FaComment className="text-indigo-400" />
              Collaborative Timeline ({comments.length})
            </h3>

            {/* Comments Feed Bubble Thread */}
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1.5 custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center items-center py-6 text-slate-500 text-xs">
                  <div className="w-4 h-4 rounded-full border border-indigo-500/20 border-t-indigo-400 animate-spin mr-2" />
                  Retrieving log feeds...
                </div>
              ) : comments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-white/5 rounded-xl">
                  No comments or logs have been recorded on this task yet. Type a note below to start the thread.
                </div>
              ) : (
                comments.map((c, idx) => {
                  const isCurrentUser = c.user_id === user?.id;
                  return (
                    <motion.div
                      key={c.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 max-w-[85%] ${isCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      {/* Avatar node */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border text-xs font-bold ${
                        isCurrentUser 
                          ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" 
                          : "bg-white/5 text-[var(--text-secondary)] border-white/5"
                      }`}>
                        <FaUser className="text-[10px]" />
                      </div>

                      {/* Bubble content */}
                      <div className="space-y-1">
                        <div className={`p-3 rounded-2xl text-xs border ${
                          isCurrentUser 
                            ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-200 rounded-tr-none" 
                            : "bg-white/5 border-white/5 text-[var(--text-primary)] rounded-tl-none"
                        }`}>
                          <p className="font-semibold text-[10px] text-[var(--text-secondary)] mb-1">
                            {c.full_name || "Team Member"}
                          </p>
                          <p className="leading-relaxed whitespace-pre-wrap">{c.comment}</p>
                        </div>
                        <p className={`text-[9px] text-slate-500 flex items-center gap-1 ${isCurrentUser ? "justify-end" : ""}`}>
                          <FaClock className="text-[8px]" />
                          {formatCommentTime(c.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Comment Form Input */}
            <form onSubmit={handleSubmitComment} className="flex gap-3 mt-2">
              <input
                type="text"
                placeholder="Share an update or tag your supervisor..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={commentMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500/50 transition-all duration-300"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || commentMutation.isPending}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all duration-300 cursor-pointer shadow-md shadow-indigo-600/10 active:scale-95 disabled:opacity-50"
              >
                <FaPaperPlane className="text-[10px]" />
                {commentMutation.isPending ? "Posting..." : "Post"}
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/10 hover:bg-white/5 text-[var(--text-primary)] rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Dismiss Details
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default TaskDetailsModal;
