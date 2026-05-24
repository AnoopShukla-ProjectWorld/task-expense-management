import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
} from "recharts";

function ProductivityChart({
  data,
}) {
  return (
    <div className="glass-panel rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-5 text-[var(--text-primary)]">
        Productivity
      </h2>

      <ResponsiveContainer
        width="100%"
        height={300}
        minHeight={300}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ProductivityChart;