import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
} from "recharts";

function ExpenseChart({
  data,
}) {
  return (
    <div className="glass-panel rounded-2xl p-5 shadow-lg">
      <h2 className="text-xl font-bold mb-5 text-[var(--text-primary)]">
        Expense Analytics
      </h2>

      <ResponsiveContainer
        width="100%"
        height={300}
        minHeight={300}
      >
        <LineChart data={data}>
          <XAxis 
            dataKey="month" 
            stroke="var(--text-secondary)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />

          <Tooltip 
            contentStyle={{ 
              backgroundColor: "var(--bg-secondary)", 
              borderColor: "var(--border-color)", 
              borderRadius: "12px", 
              color: "var(--text-primary)",
              backdropFilter: "blur(16px)"
            }}
            labelStyle={{ color: "var(--text-primary)", fontWeight: "bold" }}
            itemStyle={{ color: "var(--accent-blue)" }}
          />

          <Line
            type="monotone"
            dataKey="amount"
            stroke="var(--accent-blue)"
            strokeWidth={3}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpenseChart;