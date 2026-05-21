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
    <div
      className="
        bg-white rounded-2xl
        p-5 shadow-sm
      "
    >
      <h2 className="text-xl font-bold mb-5">
        Expense Analytics
      </h2>

      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <LineChart data={data}>
          <XAxis dataKey="month" />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="amount"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpenseChart;