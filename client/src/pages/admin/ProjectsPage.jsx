import {
  useQuery,
} from "@tanstack/react-query";

import {
  getProjects,
} from "../../services/ProjectService";

import DataTable from "../../components/tables/DataTable";

function ProjectsPage() {
  const { data } = useQuery({
    queryKey: ["projects"],

    queryFn: getProjects,
  });

  const columns = [
    {
      key: "project_name",
      title: "Project",
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
      key:
        "completion_percentage",

      title: "Progress",
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">
        Projects
      </h1>

      <DataTable
        columns={columns}
        data={data || []}
      />
    </div>
  );
}

export default ProjectsPage;