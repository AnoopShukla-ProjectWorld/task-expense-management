import { useMemo, useState } from "react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../common/EmptyState";
import TableLoader from "../loaders/TableLoader";

function DataTable({
  columns = [],
  data = [],
  loading = false,
  actions = false,
  selectable = false,
  onEdit,
  onDelete,
}) {
  const [sortKey, setSortKey] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedRows, setSelectedRows] = useState([]);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
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
    if (sortKey !== key) return <FaSort className="text-[var(--text-secondary)]/70 hover:text-[var(--text-primary)] transition-colors" />;
    return sortOrder === "asc"
      ? <FaSortUp className="text-[var(--accent-blue)]" />
      : <FaSortDown className="text-[var(--accent-blue)]" />;
  };

  if (loading) return <TableLoader />;

  if (!data.length) return <EmptyState title="No records found" />;

  return (
    <div className="overflow-hidden glass-panel rounded-2xl shadow-2xl border border-[var(--border-color)]">
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">
              {selectable && (
                <th className="px-6 py-4.5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-secondary)] text-blue-500 focus:ring-blue-500/20 focus:ring-2 cursor-pointer transition-all"
                  />
                </th>
              )}

              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="px-6 py-4.5 text-left font-bold select-none cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{column.title}</span>
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}

              {actions && (
                <th className="px-6 py-4.5 text-left font-bold">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-color)]">
            <AnimatePresence initial={false}>
              {sortedData.map((row, idx) => (
                <motion.tr
                  key={row.id ?? idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15, delay: Math.min(idx * 0.03, 0.3) }}
                  className={`
                    group text-sm text-[var(--text-primary)]
                    hover:bg-[var(--bg-hover)]
                    transition-all duration-200
                    ${selectedRows.includes(row.id) ? "bg-blue-500/10 border-blue-500/20" : ""}
                  `}
                >
                  {selectable && (
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-secondary)] text-blue-500 focus:ring-blue-500/20 focus:ring-2 cursor-pointer transition-all"
                      />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 font-medium text-[var(--text-primary)]"
                    >
                      {column.render
                        ? column.render(row)
                        : row[column.key] ?? "â€”"}
                    </td>
                  ))}

                  {actions && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit?.(row)}
                          className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete?.(row.id)}
                          className="px-3 py-1.5 bg-rose-600/10 border border-rose-500/30 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {selectedRows.length > 0 && (
        <div className="px-6 py-3.5 border-t border-[var(--border-color)] bg-blue-500/5 text-xs text-blue-450 font-bold tracking-wide flex justify-between items-center animate-fade-in">
          <span>{selectedRows.length} item{selectedRows.length > 1 ? "s" : ""} selected for bulk actions</span>
          <button 
            onClick={() => setSelectedRows([])}
            className="text-[10px] uppercase font-extrabold tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Deselect All
          </button>
        </div>
      )}
    </div>
  );
}

export default DataTable;
