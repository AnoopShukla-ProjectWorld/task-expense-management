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
    <div
      className="
        bg-white rounded-2xl
        shadow-sm p-6
      "
    >
      <h2 className="text-xl font-bold mb-5">
        Productivity
      </h2>

      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
          />

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ProductivityChart;