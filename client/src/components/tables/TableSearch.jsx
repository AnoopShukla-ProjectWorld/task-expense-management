import { FaSearch } from "react-icons/fa";

function TableSearch({ value, onChange, placeholder = "Search database records..." }) {
  return (
    <div className="relative w-full md:w-80">
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--text-secondary)] pointer-events-none">
        <FaSearch className="text-sm" />
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
        className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-350 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  );
}

export default TableSearch;