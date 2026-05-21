function Modal({
  isOpen,
  onClose,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/50
        flex justify-center items-center
      "
    >
      <div
        className="
          bg-white rounded-2xl
          p-6 w-full max-w-lg
        "
      >
        {children}

        <button
          onClick={onClose}
          className="
            mt-5 bg-red-500
            text-white px-4 py-2
            rounded-lg
          "
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default Modal;