import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

function ExpenseAnalyticsChart({
  data,
}) {
  return (
    <div className="glass-panel rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-5 text-[var(--text-primary)]">
        Expense Trends
      </h2>

      <ResponsiveContainer
        width="100%"
        height={300}
        minHeight={300}
      >
        <BarChart data={data}>
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

          <Bar 
            dataKey="amount" 
            fill="var(--accent-blue)" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpenseAnalyticsChart;