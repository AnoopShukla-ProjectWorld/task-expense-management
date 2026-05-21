import {
  useQuery,
} from "@tanstack/react-query";

import {
  getTasks,
} from "../../services/taskService";

import DataTable from "../../components/tables/DataTable";

function TasksPage() {
  const { data } = useQuery({
    queryKey: ["tasks"],

    queryFn: getTasks,
  });

  const columns = [
    {
      key: "title",
      title: "Task",
    },

    {
      key: "status",
      title: "Status",
    },

    {
      key: "priority",
      title: "Priority",
    },

    {
      key: "due_date",
      title: "Due Date",
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={data || []}
      />
    </div>
  );
}

export default TasksPage;