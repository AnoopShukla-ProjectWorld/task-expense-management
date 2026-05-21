import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";

import { Outlet } from "react-router-dom";

function DashboardLayout() {
  return (
    <div className="flex bg-gray-100">
      <Sidebar />

      <div className="flex-1 min-h-screen">
        <Navbar />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;