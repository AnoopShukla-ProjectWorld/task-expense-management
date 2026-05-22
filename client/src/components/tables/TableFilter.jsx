function TableFilters({
  filters = [],
  values = {},
  onChange,
}) {
  return (
    <div className="flex gap-4">
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={
            values[
              filter.key
            ] || ""
          }
          onChange={(e) =>
            onChange(
              filter.key,
              e.target.value
            )
          }
          className="
            border border-[var(--border-color)] rounded-xl
            px-4 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)]
            focus:outline-none focus:border-[var(--accent-blue)]/50 transition-all cursor-pointer
          "
        >
          <option value="" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
            All
          </option>

          {filter.options.map(
            (option) => (
              <option
                key={option}
                value={option}
                className="bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              >
                {option}
              </option>
            )
          )}
        </select>
      ))}
    </div>
  );
}

export default TableFilters;