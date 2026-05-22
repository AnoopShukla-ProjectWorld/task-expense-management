import { FaSearch } from "react-icons/fa";

function TableSearch({ value, onChange, placeholder = "Search database records..." }) {
  return (
    <div className="relative w-full md:w-80 group">
      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[var(--text-secondary)] group-focus-within:text-[var(--accent-blue)] transition-colors">
        <FaSearch className="text-sm" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:border-[var(--accent-blue)]/50 focus:ring-2 focus:ring-[var(--accent-blue)]/10 focus:bg-[var(--bg-secondary)] transition-all duration-300 shadow-inner"
      />
    </div>
  );
}

export default TableSearch;