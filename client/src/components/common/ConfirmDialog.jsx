function ConfirmDialog({ title, description, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="glass-panel bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-3 text-[var(--text-primary)]">{title}</h2>
        <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-all duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-red-500/10 active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;