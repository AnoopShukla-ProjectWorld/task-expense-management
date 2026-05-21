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
            border rounded-xl
            px-4 py-3 bg-white
          "
        >
          <option value="">
            All
          </option>

          {filter.options.map(
            (option) => (
              <option
                key={option}
                value={option}
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