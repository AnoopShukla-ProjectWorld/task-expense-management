import {
  useDropzone,
} from "react-dropzone";

function FileUpload({
  onDrop,
}) {
  const { getRootProps, getInputProps } =
    useDropzone({
      onDrop,
    });

  return (
    <div
      {...getRootProps()}
      className="
        border-2 border-dashed
        border-[var(--border-color)] hover:border-blue-500/50 rounded-2xl
        p-10 text-center
        cursor-pointer bg-[var(--bg-primary)]/45 hover:bg-[var(--bg-primary)]/70
        transition-all duration-300
      "
    >
      <input
        {...getInputProps()}
      />

      <p className="text-sm font-semibold text-[var(--text-primary)]">
        Drag & drop attachments here
      </p>
      <p className="text-xs text-[var(--text-secondary)]/70 mt-1">
        or click to browse files from your computer
      </p>
    </div>
  );
}

export default FileUpload;