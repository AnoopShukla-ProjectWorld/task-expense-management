import {
  useQuery,
} from "@tanstack/react-query";

import {
  getExpenses,
} from "../../services/expenseService";

import DataTable from "../../components/tables/DataTable";

function ExpensesPage() {
  const { data } = useQuery({
    queryKey: ["expenses"],

    queryFn: getExpenses,
  });

  const columns = [
    {
      key: "amount",
      title: "Amount",
    },

    {
      key: "category",
      title: "Category",
    },

    {
      key: "status",
      title: "Status",
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

export default ExpensesPage;