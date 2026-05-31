import { motion } from "framer-motion";

function DashboardCard({ title, value, icon, description, trend }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-full min-h-[160px]"
    >
      {/* Decorative background glow */}
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

      <div className="flex-1 flex flex-col justify-between h-full">
        {/* Top Section: Title, Value & Icon */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {title}
            </p>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {value}
            </h2>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xl text-blue-500 shadow-sm flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        </div>

        {/* Bottom Section: Trend Badge & Description */}
        {(description || trend) && (
          <div className="mt-4 flex items-start gap-2 pt-3 border-t border-slate-100/60">
            {trend && (
              <span className={`inline-flex items-center justify-center h-5.5 px-2 rounded-full whitespace-nowrap text-[9px] font-extrabold tracking-wide flex-shrink-0 ${
                trend.type === "positive" 
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30" 
                  : trend.type === "negative" 
                  ? "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}>
                {trend.value}
              </span>
            )}
            {description && (
              <span className="text-slate-500 font-semibold text-[10px] leading-snug flex-1 pr-1">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default DashboardCard;
