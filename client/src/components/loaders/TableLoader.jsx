function TableLoader() {
  return (
    <div
      className="
        bg-white rounded-2xl
        p-6 animate-pulse
      "
    >
      <div className="h-10 bg-gray-200 rounded mb-4" />

      <div className="space-y-3">
        {Array.from({
          length: 5,
        }).map((_, index) => (
          <div
            key={index}
            className="
              h-12 bg-gray-100
              rounded
            "
          />
        ))}
      </div>
    </div>
  );
}

export default TableLoader;