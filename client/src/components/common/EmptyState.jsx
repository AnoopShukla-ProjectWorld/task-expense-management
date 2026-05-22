function EmptyState({
  title = "No Data Found",
}) {
  return (
    <div
      className="
        glass-panel bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl
        p-10 text-center shadow-md
      "
    >
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
        {title}
      </h2>

      <p className="text-[var(--text-secondary)] mt-2 text-sm">
        Nothing available right now.
      </p>
    </div>
  );
}

export default EmptyState;