function EmptyState({
  title = "No Data Found",
}) {
  return (
    <div
      className="
        bg-white rounded-2xl
        p-10 text-center
      "
    >
      <h2 className="text-2xl font-bold">
        {title}
      </h2>

      <p className="text-gray-500 mt-2">
        Nothing available right now.
      </p>
    </div>
  );
}

export default EmptyState;