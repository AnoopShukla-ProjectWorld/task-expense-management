import KpiCards from "../../components/dashboard/KpiCards";

import ExpenseAnalyticsChart from "../../components/dashboard/ExpenseAnalyticsChart";

import ProductivityChart from "../../components/dashboard/ProductivityChart";

function ReportsPage() {
  const stats = {
    users: 120,
    projects: 34,
    tasks: 540,
    expenses: 12000,
  };

  const expenseData = [
    {
      month: "Jan",
      amount: 5000,
    },

    {
      month: "Feb",
      amount: 7000,
    },

    {
      month: "Mar",
      amount: 6500,
    },
  ];

  const productivityData = [
    {
      name: "Completed",
      value: 70,
    },

    {
      name: "Pending",
      value: 30,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Analytics Dashboard
        </h1>

        <p className="text-gray-500">
          Enterprise reports &
          analytics
        </p>
      </div>

      <KpiCards stats={stats} />

      <div
        className="
          grid grid-cols-1
          xl:grid-cols-2
          gap-6
        "
      >
        <ExpenseAnalyticsChart
          data={expenseData}
        />

        <ProductivityChart
          data={
            productivityData
          }
        />
      </div>
    </div>
  );
}

export default ReportsPage;