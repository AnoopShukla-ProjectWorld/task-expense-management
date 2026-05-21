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
    <div
      className="
        bg-white rounded-2xl
        shadow-sm p-6
      "
    >
      <h2 className="text-xl font-bold mb-5">
        Expense Trends
      </h2>

      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <BarChart data={data}>
          <XAxis dataKey="month" />

          <Tooltip />

          <Bar dataKey="amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpenseAnalyticsChart;