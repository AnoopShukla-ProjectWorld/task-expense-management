import { useQuery } from "@tanstack/react-query";
import { getExpenses } from "../../services/expenseService";
import DataTable from "../../components/tables/DataTable";

function ExpensesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: getExpenses,
  });

  const columns = [
    { key: "amount", title: "Amount" },
    { key: "category", title: "Category" },
    { key: "status", title: "Status" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Expenses</h1>
      <DataTable columns={columns} data={data || []} loading={isLoading} />
    </div>
  );
}

export default ExpensesPage;