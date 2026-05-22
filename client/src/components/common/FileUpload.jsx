import { useDropzone } from "react-dropzone";
import { FaCloudUploadAlt, FaFileAlt } from "react-icons/fa";

function FileUpload({ onDrop, selectedFile }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB limit
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-md ${
        isDragActive
          ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          : selectedFile
          ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          : "border-white/10 hover:border-violet-500/30 hover:bg-white/[0.03] bg-white/[0.01]"
      }`}
    >
      <input {...getInputProps()} />

      {selectedFile ? (
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <FaFileAlt className="text-2xl animate-pulse" />
          </div>
          <p className="text-xs font-semibold text-emerald-400">Receipt Attached!</p>
          <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs">{selectedFile.name}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-white/5 text-slate-400 border border-white/5 group-hover:text-white transition-colors">
            <FaCloudUploadAlt className="text-2xl" />
          </div>
          {isDragActive ? (
            <p className="text-xs font-medium text-emerald-400">Release to attach receipt...</p>
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-200">
                Drag & drop a receipt here, or <span className="text-violet-400 underline hover:text-violet-300">browse</span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Supports PDF, JPG, PNG (Max 5MB)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
