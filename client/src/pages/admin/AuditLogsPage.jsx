import {
  useQuery,
} from "@tanstack/react-query";

import {
  getAuditLogs,
} from "../../services/reportService";

import DataTable from "../../components/tables/DataTable";

function AuditLogsPage() {
  const { data } = useQuery({
    queryKey: ["auditLogs"],

    queryFn: getAuditLogs,
  });

  const columns = [
    {
      key: "action",
      title: "Action",
    },

    {
      key: "entity_name",
      title: "Entity",
    },

    {
      key: "created_at",
      title: "Date",
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data || []}
    />
  );
}

export default AuditLogsPage;