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
        bg-slate-800/50 backdrop-blur-sm
        flex justify-center items-center p-4
      "
    >
      <div
        className="
          glass-panel bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl
          p-6 w-full max-w-lg shadow-2xl
        "
      >
        {children}

        <button
          onClick={onClose}
          className="
            mt-5 px-4 py-2 border border-[var(--border-color)]
            bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]
            text-[var(--text-secondary)] hover:text-[var(--text-primary)]
            rounded-xl font-semibold transition-all duration-200 cursor-pointer
          "
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default Modal;
