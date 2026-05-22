import { motion } from "framer-motion";

function DashboardCard({ title, value, icon, description, trend }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden"
    >
      {/* Decorative background glow */}
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            {title}
          </p>
          <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {value}
          </h2>
        </div>

        <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-2xl text-[var(--accent-blue)] shadow-sm">
          {icon}
        </div>
      </div>

      {(description || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-semibold px-2 py-0.5 rounded-full ${
              trend.type === "positive" 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : trend.type === "negative" 
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]"
            }`}>
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-[var(--text-secondary)] font-medium">
              {description}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default DashboardCard;