import { FaSearch } from "react-icons/fa";

function TableSearch({ value, onChange, placeholder = "Search database records..." }) {
  return (
    <div className="relative w-full md:w-80 group">
      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
        <FaSearch className="text-sm" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-400 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-white/[0.07] transition-all duration-300 shadow-inner"
      />
    </div>
  );
}

export default TableSearch;