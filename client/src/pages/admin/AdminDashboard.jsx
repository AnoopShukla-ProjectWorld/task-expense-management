import { useQuery } from "@tanstack/react-query";
import { FaUsers, FaTasks, FaMoneyBill, FaProjectDiagram } from "react-icons/fa";
import DashboardCard from "../../components/dashboard/DashboardCard";
import PageLoader from "../../components/loaders/PageLoader";
import { getAdminDashboardStats } from "../../services/reportService";
import { useAuth } from "../../context/AuthContext";

function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: getAdminDashboardStats,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.fullName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Users"
          value={stats?.total_users ?? 0}
          icon={<FaUsers />}
        />
        <DashboardCard
          title="Total Projects"
          value={stats?.total_projects ?? 0}
          icon={<FaProjectDiagram />}
        />
        <DashboardCard
          title="Total Tasks"
          value={stats?.total_tasks ?? 0}
          icon={<FaTasks />}
        />
        <DashboardCard
          title="Pending Expenses"
          value={stats?.pending_expenses ?? 0}
          icon={<FaMoneyBill />}
        />
      </div>
    </div>
  );
}

export default AdminDashboard;