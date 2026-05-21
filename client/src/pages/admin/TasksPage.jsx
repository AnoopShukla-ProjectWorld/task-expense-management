import { useQuery } from "@tanstack/react-query";
import { getTasks } from "../../services/taskService";
import DataTable from "../../components/tables/DataTable";

function TasksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  const columns = [
    { key: "title", title: "Task" },
    { key: "status", title: "Status" },
    { key: "priority", title: "Priority" },
    { key: "due_date", title: "Due Date" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Tasks</h1>
      <DataTable columns={columns} data={data || []} loading={isLoading} />
    </div>
  );
}

export default TasksPage;