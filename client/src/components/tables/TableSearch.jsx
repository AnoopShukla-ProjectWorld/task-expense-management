function TableSearch({
  value,
  onChange,
}) {
  return (
    <input
      type="text"
      placeholder="Search..."
      value={value}
      onChange={onChange}
      className="
        w-full md:w-80
        border rounded-xl
        px-4 py-3
        outline-none
        focus:ring-2 focus:ring-blue-500
      "
    />
  );
}

export default TableSearch;