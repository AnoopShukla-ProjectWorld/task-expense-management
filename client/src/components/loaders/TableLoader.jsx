function TableLoader() {
  return (
    <div
      className="
        glass-panel bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl
        p-6 animate-pulse
      "
    >
      <div className="h-10 bg-[var(--bg-primary)] rounded mb-4" />

      <div className="space-y-3">
        {Array.from({
          length: 5,
        }).map((_, index) => (
          <div
            key={index}
            className="
              h-12 bg-[var(--bg-primary)]/70
              rounded
            "
          />
        ))}
      </div>
    </div>
  );
}

export default TableLoader;