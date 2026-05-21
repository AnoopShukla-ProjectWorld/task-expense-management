import {
  FaUsers,
  FaTasks,
  FaMoneyBill,
  FaProjectDiagram,
} from "react-icons/fa";

import DashboardCard from "./DashboardCard";

function KpiCards({
  stats,
}) {
  return (
    <div
      className="
        grid grid-cols-1
        md:grid-cols-2
        xl:grid-cols-4
        gap-6
      "
    >
      <DashboardCard
        title="Users"
        value={stats.users}
        icon={<FaUsers />}
      />

      <DashboardCard
        title="Projects"
        value={stats.projects}
        icon={
          <FaProjectDiagram />
        }
      />

      <DashboardCard
        title="Tasks"
        value={stats.tasks}
        icon={<FaTasks />}
      />

      <DashboardCard
        title="Expenses"
        value={stats.expenses}
        icon={<FaMoneyBill />}
      />
    </div>
  );
}

export default KpiCards;