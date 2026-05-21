import { useMemo, useState } from "react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import EmptyState from "../common/EmptyState";
import TableLoader from "../loaders/TableLoader";

function DataTable({
  columns = [],
  data = [],
  loading = false,
  actions = false,
  onEdit,
  onDelete,
}) {
  const [sortKey, setSortKey] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedRows, setSelectedRows] = useState([]);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      if (sortOrder === "asc") return a[sortKey] > b[sortKey] ? 1 : -1;
      return a[sortKey] < b[sortKey] ? 1 : -1;
    });
  }, [data, sortKey, sortOrder]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((row) => row.id));
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((item) => item !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const getSortIcon = (key) => {
    if (sortKey !== key) return <FaSort className="text-gray-400" />;
    return sortOrder === "asc"
      ? <FaSortUp className="text-blue-500" />
      : <FaSortDown className="text-blue-500" />;
  };

  if (loading) return <TableLoader />;

  if (!data.length) return <EmptyState title="No records found" />;

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-5 py-4 w-10">
              <input
                type="checkbox"
                checked={selectedRows.length === data.length}
                onChange={handleSelectAll}
                className="rounded"
              />
            </th>

            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => handleSort(column.key)}
                className="px-5 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  {column.title}
                  {getSortIcon(column.key)}
                </div>
              </th>
            ))}

            {actions && (
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {sortedData.map((row) => (
            <tr
              key={row.id}
              className={`
                border-t border-gray-100
                hover:bg-gray-50
                transition-colors duration-150
                ${selectedRows.includes(row.id) ? "bg-blue-50" : ""}
              `}
            >
              <td className="px-5 py-4">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(row.id)}
                  onChange={() => handleSelectRow(row.id)}
                  className="rounded"
                />
              </td>

              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-5 py-4 text-sm text-gray-700"
                >
                  {column.render
                    ? column.render(row)
                    : row[column.key] ?? "—"}
                </td>
              ))}

              {actions && (
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit?.(row)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete?.(row.id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {selectedRows.length > 0 && (
        <div className="px-5 py-3 border-t bg-blue-50 text-sm text-blue-700 font-medium">
          {selectedRows.length} row{selectedRows.length > 1 ? "s" : ""} selected
        </div>
      )}
    </div>
  );
}

export default DataTable;