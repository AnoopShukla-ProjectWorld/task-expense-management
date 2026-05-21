function TablePagination({
  page,
  totalPages,
  onPageChange,
}) {
  return (
    <div className="flex gap-3 justify-end mt-5">
      <button
        disabled={page === 1}
        onClick={() =>
          onPageChange(page - 1)
        }
        className="px-4 py-2 border rounded-lg"
      >
        Prev
      </button>

      <span>
        {page} / {totalPages}
      </span>

      <button
        disabled={
          page === totalPages
        }
        onClick={() =>
          onPageChange(page + 1)
        }
        className="px-4 py-2 border rounded-lg"
      >
        Next
      </button>
    </div>
  );
}

export default TablePagination;