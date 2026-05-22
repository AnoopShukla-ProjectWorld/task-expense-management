function Input({
  label,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </label>
      )}

      <input
        className={`
          w-full rounded-xl border bg-[var(--bg-tertiary)]
          border-[var(--border-color)] px-4 py-2.5
          outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50
          transition-all duration-300
          focus:border-[var(--accent-blue)]/50 focus:ring-2 focus:ring-[var(--accent-blue)]/10 focus:bg-[var(--bg-secondary)]
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="text-xs text-rose-500 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;